package service

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"io"
	"math"
	"math/big"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	gethcommon "github.com/ethereum/go-ethereum/common"
	gethtypes "github.com/ethereum/go-ethereum/core/types"
	gethcrypto "github.com/ethereum/go-ethereum/crypto"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/sha3"
)

type USDTService interface {
	GetDepositAddress(ctx context.Context) (string, error)
	CheckDepositReadiness(ctx context.Context, walletAddress string, amountUSD float64) (*DepositCheck, error)
	VerifyDeposit(ctx context.Context, userID uuid.UUID, txHash string, expectedAmount float64) error
	ProcessAutoWithdrawal(ctx context.Context, withdrawalID, userID uuid.UUID, recipientAddress string, amountUSD float64) (string, error)
	IsTransactionMined(ctx context.Context, txHash string) (bool, error)
	// IsTransactionKnown reports whether the chain (pending or mined) knows about
	// the given transaction hash. Returns false only when the tx is not present
	// anywhere on the node — the signal used before a safe refund.
	IsTransactionKnown(ctx context.Context, txHash string) (bool, error)
	GetMasterWalletBalance(ctx context.Context) (*MasterWalletBalance, error)
}

const transferTopic = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

// payoutLockKey derives a stable Postgres advisory lock id from the sender
// address and chain ID so concurrent payouts that share a master wallet are
// serialized even across multiple backend replicas.
func payoutLockKey(fromAddress string, chainID *big.Int) int64 {
	h := fnv.New64a()
	h.Write([]byte(strings.ToLower(fromAddress) + ":" + chainID.String()))
	return int64(h.Sum64())
}

// txHashForRawTx computes the on-chain transaction hash for a signed raw
// transaction (EIP-155 legacy: hash = keccak256(RLP(signed tx))).
func txHashForRawTx(rawTx []byte) string {
	return "0x" + hex.EncodeToString(keccak256(rawTx))
}

type bscReceipt struct {
	Status string `json:"status"`
	Logs   []struct {
		Address string   `json:"address"`
		Topics  []string `json:"topics"`
		Data    string   `json:"data"`
	} `json:"logs"`
}

// usdToUnits converts a USD amount (at most 2 decimal places) into raw token
// units for the given token decimals using integer cents, avoiding float string
// formatting and precision drift.
func usdToUnits(amount float64, decimals int) (*big.Int, error) {
	cents := int64(math.Round(amount * 100))
	if cents < 0 {
		return nil, fmt.Errorf("amount must be non-negative")
	}
	units := new(big.Int).Mul(
		new(big.Int).SetInt64(cents),
		new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals-2)), nil),
	)
	return units, nil
}

// VerifyDeposit validates an actual mined BEP-20 Transfer event. The server never
// trusts a client supplied amount or address; both are resolved from our DB.
func (s *usdtService) VerifyDeposit(ctx context.Context, userID uuid.UUID, txHash string, expectedAmount float64) error {
	txHash = strings.TrimSpace(txHash)
	if !strings.HasPrefix(txHash, "0x") || len(txHash) != 66 {
		return fmt.Errorf("invalid BSC transaction hash")
	}
	if s.depositAddress == "" {
		return fmt.Errorf("DEPOSIT_ADDRESS not configured in environment")
	}
	if !gethcommon.IsHexAddress(s.depositAddress) {
		return fmt.Errorf("DEPOSIT_ADDRESS is not a valid BEP-20 address")
	}
	depositAddress := s.depositAddress
	rpcURL := os.Getenv("BSC_RPC_URL")
	if rpcURL == "" {
		return fmt.Errorf("BSC_RPC_URL not configured")
	}
	var receipt bscReceipt
	if err := callBSCJSON(ctx, rpcURL, "eth_getTransactionReceipt", []interface{}{txHash}, &receipt); err != nil {
		return err
	}
	if receipt.Status != "0x1" {
		return fmt.Errorf("transaction is not successful or not mined yet")
	}

	contract := strings.ToLower(strings.TrimPrefix(os.Getenv("USDT_CONTRACT_ADDRESS"), "0x"))
	recipient := strings.ToLower(strings.TrimPrefix(depositAddress, "0x"))
	decimals := 18
	if raw := os.Getenv("USDT_DECIMALS"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed >= 2 && parsed <= 36 {
			decimals = parsed
		}
	}
	expectedUnits, err := usdToUnits(expectedAmount, decimals)
	if err != nil {
		return fmt.Errorf("invalid investment amount")
	}

	for _, logItem := range receipt.Logs {
		if strings.ToLower(strings.TrimPrefix(logItem.Address, "0x")) != contract || len(logItem.Topics) < 3 {
			continue
		}
		if strings.ToLower(strings.TrimPrefix(logItem.Topics[0], "0x")) != transferTopic {
			continue
		}
		to := strings.ToLower(strings.TrimPrefix(logItem.Topics[2], "0x"))
		if len(to) < 40 || to[len(to)-40:] != recipient {
			continue
		}
		value, ok := new(big.Int).SetString(strings.TrimPrefix(logItem.Data, "0x"), 16)
		if ok && value.Cmp(expectedUnits) == 0 {
			_ = s.auditService.Log(ctx, &userID, "DEPOSIT_VERIFIED", expectedAmount, expectedAmount, txHash, "SUCCESS", fmt.Sprintf(`{"address":"%s"}`, depositAddress))
			return nil
		}
	}
	_ = s.auditService.Log(ctx, &userID, "DEPOSIT_VERIFIED", expectedAmount, expectedAmount, txHash, "FAILED", "{}")
	return fmt.Errorf("no exact USDT deposit found for this investment")
}

type MasterWalletBalance struct {
	Address string  `json:"address"`
	BNB     float64 `json:"bnb"`
	USDT    float64 `json:"usdt"`
}

// DepositCheck is the response to a pre-sign readiness check: does the wallet
// hold enough USDT for the requested amount and enough BNB to cover gas?
type DepositCheck struct {
	WalletAddress  string  `json:"wallet_address"`
	DepositAddress string  `json:"deposit_address"`
	Amount         float64 `json:"amount"`
	USDTBalance    float64 `json:"usdt_balance"`
	BNBBalance     float64 `json:"bnb_balance"`
	GasCostBNB     float64 `json:"gas_cost_bnb"`
	HasEnoughUSDT  bool    `json:"has_enough_usdt"`
	HasEnoughBNB   bool    `json:"has_enough_bnb"`
}

type usdtService struct {
	db                *pgxpool.Pool
	auditService      AuditService
	masterKeyPresent  bool // true if MASTER_PRIVATE_KEY is set in environment
	depositAddress    string
}

func NewUSDTService(db *pgxpool.Pool, auditService AuditService) USDTService {
	masterHex := strings.TrimPrefix(os.Getenv("MASTER_PRIVATE_KEY"), "0x")
	present := masterHex != ""
	return &usdtService{
		db:               db,
		auditService:     auditService,
		masterKeyPresent: present,
		depositAddress:   strings.TrimSpace(os.Getenv("DEPOSIT_ADDRESS")),
	}
}

// keccak256 calculates the Ethereum Keccak-256 hash of data
func keccak256(data ...[]byte) []byte {
	d := sha3.NewLegacyKeccak256()
	for _, b := range data {
		d.Write(b)
	}
	return d.Sum(nil)
}

// pubkeyToAddress derives a 42-character hex BEP-20 / Ethereum address from ECDSA public key
func pubkeyToAddress(pub *ecdsa.PublicKey) string {
	if pub == nil || pub.X == nil || pub.Y == nil {
		return ""
	}
	pubBytes := make([]byte, 64)
	xBytes := pub.X.Bytes()
	yBytes := pub.Y.Bytes()
	copy(pubBytes[32-len(xBytes):32], xBytes)
	copy(pubBytes[64-len(yBytes):64], yBytes)

	hash := keccak256(pubBytes)
	return "0x" + hex.EncodeToString(hash[12:])
}

// hexToPrivateKey parses a raw 32-byte hex private key string into ecdsa.PrivateKey using secp256k1 curve
func hexToPrivateKey(hexKey string) (*ecdsa.PrivateKey, error) {
	hexKey = strings.TrimPrefix(hexKey, "0x")
	return gethcrypto.HexToECDSA(hexKey)
}

// GetDepositAddress returns the single shared BEP-20 deposit address
// configured via DEPOSIT_ADDRESS (env). All users deposit to this one address;
// per-user HD-wallet derivation has been removed.
func (s *usdtService) GetDepositAddress(ctx context.Context) (string, error) {
	if s.depositAddress == "" {
		return "", fmt.Errorf("DEPOSIT_ADDRESS not configured in environment; cannot provide deposit address")
	}
	if !gethcommon.IsHexAddress(s.depositAddress) {
		return "", fmt.Errorf("DEPOSIT_ADDRESS is not a valid BEP-20 address")
	}
	return s.depositAddress, nil
}

// ProcessAutoWithdrawal executes automatic USDT transfer on BSC network using master private key from .env
func (s *usdtService) ProcessAutoWithdrawal(ctx context.Context, withdrawalID, userID uuid.UUID, recipientAddress string, amountUSD float64) (string, error) {
	if !s.masterKeyPresent {
		return "", fmt.Errorf("MASTER_PRIVATE_KEY not configured in environment; cannot process auto withdrawal")
	}

	masterHex := strings.TrimPrefix(os.Getenv("MASTER_PRIVATE_KEY"), "0x")
	privKey, err := hexToPrivateKey(masterHex)
	if err != nil {
		return "", fmt.Errorf("failed to parse master private key: %v", err)
	}

	if !gethcommon.IsHexAddress(recipientAddress) {
		return "", fmt.Errorf("invalid recipient BEP-20 address")
	}
	contractAddress := os.Getenv("USDT_CONTRACT_ADDRESS")
	if !gethcommon.IsHexAddress(contractAddress) {
		return "", fmt.Errorf("invalid USDT_CONTRACT_ADDRESS")
	}
	rpcURL := os.Getenv("BSC_RPC_URL")
	if rpcURL == "" {
		return "", fmt.Errorf("BSC_RPC_URL not configured")
	}
	fromAddress := gethcrypto.PubkeyToAddress(privKey.PublicKey).Hex()

	// Resolve the chain ID up front so the distributed lock can be keyed by the
	// sender address and chain ID.
	chainIDHex, err := callBSC(ctx, rpcURL, "eth_chainId", []interface{}{})
	if err != nil {
		return "", err
	}
	chainID, ok := new(big.Int).SetString(strings.TrimPrefix(chainIDHex, "0x"), 16)
	if !ok {
		return "", fmt.Errorf("invalid BSC chain ID")
	}

	// Serialize the nonce-fetch -> sign -> broadcast sequence with a distributed
	// Postgres advisory lock keyed by sender address + chain ID, so replicas
	// sharing the same master wallet can never allocate the same nonce. The lock
	// is held on a dedicated connection for the whole sequence.
	lockKey := payoutLockKey(fromAddress, chainID)
	conn, err := s.db.Acquire(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to acquire db connection for payout lock: %w", err)
	}
	defer conn.Release()
	if _, err := conn.Exec(ctx, `SELECT pg_advisory_lock($1)`, lockKey); err != nil {
		return "", fmt.Errorf("failed to acquire payout lock: %w", err)
	}
	defer func() { _, _ = conn.Exec(context.Background(), `SELECT pg_advisory_unlock($1)`, lockKey) }()

	nonceHex, err := callBSC(ctx, rpcURL, "eth_getTransactionCount", []interface{}{fromAddress, "pending"})
	if err != nil {
		return "", err
	}
	gasPriceHex, err := callBSC(ctx, rpcURL, "eth_gasPrice", []interface{}{})
	if err != nil {
		return "", err
	}
	nonce, ok := new(big.Int).SetString(strings.TrimPrefix(nonceHex, "0x"), 16)
	if !ok {
		return "", fmt.Errorf("invalid BSC nonce")
	}
	gasPrice, ok := new(big.Int).SetString(strings.TrimPrefix(gasPriceHex, "0x"), 16)
	if !ok {
		return "", fmt.Errorf("invalid BSC gas price")
	}

	decimals := 18
	if raw := os.Getenv("USDT_DECIMALS"); raw != "" {
		if parsed, parseErr := strconv.Atoi(raw); parseErr == nil && parsed >= 2 && parsed <= 36 {
			decimals = parsed
		}
	}
	amountUnits, err := usdToUnits(amountUSD, decimals)
	if err != nil {
		return "", fmt.Errorf("invalid payout amount")
	}

	// ERC-20 transfer(address,uint256) calldata.
	methodID := keccak256([]byte("transfer(address,uint256)"))[:4]
	toBytes := commonAddressBytes(recipientAddress)
	data := append([]byte{}, methodID...)
	data = append(data, make([]byte, 12)...)
	data = append(data, toBytes...)
	amountBytes := make([]byte, 32)
	amountUnits.FillBytes(amountBytes)
	data = append(data, amountBytes...)

	tx := gethtypes.NewTransaction(nonce.Uint64(), gethcommon.HexToAddress(contractAddress), big.NewInt(0), 100000, gasPrice, data)
	signedTx, err := gethtypes.SignTx(tx, gethtypes.NewEIP155Signer(chainID), privKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign payout transaction: %w", err)
	}
	rawTx, err := signedTx.MarshalBinary()
	if err != nil {
		return "", fmt.Errorf("failed to encode payout transaction: %w", err)
	}
	txHash, err := callBSC(ctx, rpcURL, "eth_sendRawTransaction", []interface{}{"0x" + hex.EncodeToString(rawTx)})
	if err != nil {
		// A JSON-RPC error (e.g. "insufficient funds for gas", "nonce too low")
		// means the node REJECTED the transaction — it was never broadcast, so
		// the caller can refund the user immediately instead of leaving them
		// stuck in PROCESSING. Only a transport-level failure (request failed /
		// timeout) is ambiguous: the tx may have been accepted even though the
		// RPC response was lost, so return the locally computed hash and let
		// on-chain reconciliation decide.
		if strings.Contains(err.Error(), "BSC RPC request failed") {
			return txHashForRawTx(rawTx), fmt.Errorf("failed to broadcast payout transaction: %w", err)
		}
		return "", fmt.Errorf("payout transaction was rejected by the BSC node: %w", err)
	}

	// Audit log for withdrawal payout execution
	_ = s.auditService.Log(
		ctx,
		&userID,
		"AUTO_WITHDRAWAL_PAYOUT",
		amountUSD,
		amountUSD,
		txHash,
		"PROCESSED",
		fmt.Sprintf(`{"from":"%s","to":"%s","withdrawal_id":"%s"}`, fromAddress, recipientAddress, withdrawalID.String()),
	)

	return txHash, nil
}

func commonAddressBytes(address string) []byte {
	return gethcommon.HexToAddress(address).Bytes()
}

// IsTransactionMined reports whether a transaction hash has a mined and
// successful on-chain receipt. A not-yet-mined transaction returns (false, nil).
func (s *usdtService) IsTransactionMined(ctx context.Context, txHash string) (bool, error) {
	rpcURL := os.Getenv("BSC_RPC_URL")
	if rpcURL == "" {
		return false, fmt.Errorf("BSC_RPC_URL not configured")
	}
	var receipt bscReceipt
	if err := callBSCJSON(ctx, rpcURL, "eth_getTransactionReceipt", []interface{}{txHash}, &receipt); err != nil {
		if strings.Contains(err.Error(), "transaction not mined yet") {
			return false, nil
		}
		return false, err
	}
	return receipt.Status == "0x1", nil
}

// IsTransactionKnown reports whether the node knows about the tx at all.
// Unlike IsTransactionMined, a tx stuck in the mempool (or mined but receipt
// not yet available) still returns true, so it must never be auto-refunded.
func (s *usdtService) IsTransactionKnown(ctx context.Context, txHash string) (bool, error) {
	rpcURL := os.Getenv("BSC_RPC_URL")
	if rpcURL == "" {
		return false, fmt.Errorf("BSC_RPC_URL not configured")
	}
	var result string
	if err := callBSCJSON(ctx, rpcURL, "eth_getTransactionByHash", []interface{}{txHash}, &result); err != nil {
		if strings.Contains(err.Error(), "transaction not mined yet") {
			return false, nil
		}
		return false, err
	}
	return strings.TrimSpace(result) != "" && strings.TrimSpace(result) != "null", nil
}

// GetMasterWalletBalance reads the native BNB and BEP-20 USDT balances from BSC.
// It deliberately returns only the public address and balances, never the private key.
func (s *usdtService) GetMasterWalletBalance(ctx context.Context) (*MasterWalletBalance, error) {
	if !s.masterKeyPresent {
		return nil, fmt.Errorf("MASTER_PRIVATE_KEY not configured in environment; cannot fetch master wallet balance")
	}

	masterHex := strings.TrimPrefix(os.Getenv("MASTER_PRIVATE_KEY"), "0x")
	privKey, err := hexToPrivateKey(masterHex)
	if err != nil {
		return nil, fmt.Errorf("failed to parse master private key: %v", err)
	}
	address := pubkeyToAddress(&privKey.PublicKey)
	return s.getWalletBalance(ctx, address)
}

func (s *usdtService) getWalletBalance(ctx context.Context, address string) (*MasterWalletBalance, error) {
	rpcURL := os.Getenv("BSC_RPC_URL")
	if rpcURL == "" {
		return nil, fmt.Errorf("BSC_RPC_URL not configured")
	}

	native, err := callBSC(ctx, rpcURL, "eth_getBalance", []interface{}{address, "latest"})
	if err != nil {
		return nil, err
	}
	nativeWei, ok := new(big.Int).SetString(strings.TrimPrefix(native, "0x"), 16)
	if !ok {
		return nil, fmt.Errorf("invalid BNB balance returned by BSC")
	}
	usdtRaw, err := callBSC(ctx, rpcURL, "eth_call", []interface{}{map[string]string{
		"to":   os.Getenv("USDT_CONTRACT_ADDRESS"),
		"data": "0x70a08231" + strings.Repeat("0", 64-len(strings.TrimPrefix(address, "0x"))) + strings.TrimPrefix(address, "0x"),
	}, "latest"})
	if err != nil {
		return nil, err
	}
	usdtUnits, ok := new(big.Int).SetString(strings.TrimPrefix(usdtRaw, "0x"), 16)
	if !ok {
		return nil, fmt.Errorf("invalid USDT balance returned by BSC")
	}

	bnb, _ := new(big.Float).Quo(new(big.Float).SetInt(nativeWei), big.NewFloat(1e18)).Float64()
	// USDT decimals come from USDT_DECIMALS (default 18) so 6-decimal USDT
	// deployments report the correct balance instead of being off by 10^12 (H8).
	usdtDecimals := 18
	if v := os.Getenv("USDT_DECIMALS"); v != "" {
		if d, err := strconv.Atoi(v); err == nil && d >= 0 && d <= 18 {
			usdtDecimals = d
		}
	}
	usdt, _ := new(big.Float).Quo(new(big.Float).SetInt(usdtUnits), big.NewFloat(math.Pow10(usdtDecimals))).Float64()
	return &MasterWalletBalance{
		Address: address,
		BNB:     bnb,
		USDT:    usdt,
	}, nil
}

// CheckDepositReadiness verifies on-chain that the wallet has enough USDT for
// the requested deposit and enough BNB to cover the estimated transfer gas cost.
// It is a pre-sign safety check; the actual transfer is signed by the client.
func (s *usdtService) CheckDepositReadiness(ctx context.Context, walletAddress string, amountUSD float64) (*DepositCheck, error) {
	if !gethcommon.IsHexAddress(walletAddress) {
		return nil, fmt.Errorf("invalid wallet address")
	}
	if s.depositAddress == "" {
		return nil, fmt.Errorf("DEPOSIT_ADDRESS not configured in environment")
	}
	if amountUSD <= 0 {
		return nil, fmt.Errorf("amount must be greater than zero")
	}

	rpcURL := os.Getenv("BSC_RPC_URL")
	if rpcURL == "" {
		return nil, fmt.Errorf("BSC_RPC_URL not configured")
	}

	bal, err := s.getWalletBalance(ctx, walletAddress)
	if err != nil {
		return nil, err
	}

	// Estimate gas for the ERC-20 transfer(wallet -> depositAddress, amount).
	contract := os.Getenv("USDT_CONTRACT_ADDRESS")
	if contract == "" {
		return nil, fmt.Errorf("USDT_CONTRACT_ADDRESS not configured")
	}
	decimals := 18
	if raw := os.Getenv("USDT_DECIMALS"); raw != "" {
		if parsed, parseErr := strconv.Atoi(raw); parseErr == nil && parsed >= 2 && parsed <= 36 {
			decimals = parsed
		}
	}
	amountUnits, err := usdToUnits(amountUSD, decimals)
	if err != nil {
		return nil, fmt.Errorf("invalid deposit amount")
	}

	methodID := keccak256([]byte("transfer(address,uint256)"))[:4]
	toBytes := commonAddressBytes(s.depositAddress)
	data := append([]byte{}, methodID...)
	data = append(data, make([]byte, 12)...)
	data = append(data, toBytes...)
	amountBytes := make([]byte, 32)
	amountUnits.FillBytes(amountBytes)
	data = append(data, amountBytes...)

	gasLimitHex, err := callBSC(ctx, rpcURL, "eth_estimateGas", []interface{}{map[string]interface{}{
		"from": walletAddress,
		"to":   contract,
		"data": "0x" + hex.EncodeToString(data),
	}})
	if err != nil {
		return nil, err
	}
	gasLimit, ok := new(big.Int).SetString(strings.TrimPrefix(gasLimitHex, "0x"), 16)
	if !ok {
		return nil, fmt.Errorf("invalid gas estimate returned by BSC")
	}
	gasPriceHex, err := callBSC(ctx, rpcURL, "eth_gasPrice", []interface{}{})
	if err != nil {
		return nil, err
	}
	gasPrice, ok := new(big.Int).SetString(strings.TrimPrefix(gasPriceHex, "0x"), 16)
	if !ok {
		return nil, fmt.Errorf("invalid gas price returned by BSC")
	}

	gasCostWei := new(big.Int).Mul(gasLimit, gasPrice)
	gasCostBNB, _ := new(big.Float).Quo(new(big.Float).SetInt(gasCostWei), big.NewFloat(1e18)).Float64()

	check := &DepositCheck{
		WalletAddress:  walletAddress,
		DepositAddress: s.depositAddress,
		Amount:         amountUSD,
		USDTBalance:    bal.USDT,
		BNBBalance:     bal.BNB,
		GasCostBNB:     gasCostBNB,
		HasEnoughUSDT:  bal.USDT >= amountUSD,
		HasEnoughBNB:   bal.BNB >= gasCostBNB,
	}
	_ = s.auditService.Log(ctx, nil, "DEPOSIT_READINESS_CHECK", amountUSD, 0, "", "SUCCESS", fmt.Sprintf(`{"wallet":"%s","usdt":%.4f,"bnb":%.8f,"gas":%.8f}`, walletAddress, bal.USDT, bal.BNB, gasCostBNB))
	return check, nil
}

// bscHTTPClient carries a hard timeout so a slow RPC node can never hang a
// payout or balance request indefinitely (M6).
var bscHTTPClient = &http.Client{Timeout: 15 * time.Second}

func callBSC(ctx context.Context, url, method string, params []interface{}) (string, error) {
	payload, err := json.Marshal(map[string]interface{}{"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := bscHTTPClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("BSC RPC request failed: %w", err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("BSC RPC returned HTTP %d", resp.StatusCode)
	}
	var result struct {
		Result string `json:"result"`
		Error  *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("invalid BSC RPC response: %w", err)
	}
	if result.Error != nil {
		return "", fmt.Errorf("BSC RPC error: %s", result.Error.Message)
	}
	return result.Result, nil
}

func callBSCJSON(ctx context.Context, url, method string, params []interface{}, out interface{}) error {
	payload, err := json.Marshal(map[string]interface{}{"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := bscHTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("BSC RPC returned HTTP %d", resp.StatusCode)
	}
	var envelope struct {
		Result json.RawMessage `json:"result"`
		Error  *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&envelope); err != nil {
		return err
	}
	if envelope.Error != nil {
		return fmt.Errorf("BSC RPC: %s", envelope.Error.Message)
	}
	if len(envelope.Result) == 0 || string(envelope.Result) == "null" {
		return fmt.Errorf("transaction not mined yet")
	}
	return json.Unmarshal(envelope.Result, out)
}
