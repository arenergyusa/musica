package service

import (
	"bytes"
	"context"
	"crypto/ecdsa"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/arenergyusa/musica/backend/internal/domain"
	gethcommon "github.com/ethereum/go-ethereum/common"
	gethtypes "github.com/ethereum/go-ethereum/core/types"
	gethcrypto "github.com/ethereum/go-ethereum/crypto"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/sha3"
)

type USDTService interface {
	GetOrCreateDepositAddress(ctx context.Context, userID uuid.UUID) (*domain.UserDepositAddress, error)
	GetDepositWalletBalance(ctx context.Context, userID uuid.UUID) (*MasterWalletBalance, error)
	VerifyDeposit(ctx context.Context, userID uuid.UUID, txHash string, expectedAmount float64) error
	ProcessAutoWithdrawal(ctx context.Context, withdrawalID, userID uuid.UUID, recipientAddress string, amountUSD float64) (string, error)
	GetMasterWalletBalance(ctx context.Context) (*MasterWalletBalance, error)
}

const transferTopic = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

type bscReceipt struct {
	Status string `json:"status"`
	Logs   []struct {
		Address string   `json:"address"`
		Topics  []string `json:"topics"`
		Data    string   `json:"data"`
	} `json:"logs"`
}

// VerifyDeposit validates an actual mined BEP-20 Transfer event. The server never
// trusts a client supplied amount or address; both are resolved from our DB.
func (s *usdtService) VerifyDeposit(ctx context.Context, userID uuid.UUID, txHash string, expectedAmount float64) error {
	txHash = strings.TrimSpace(txHash)
	if !strings.HasPrefix(txHash, "0x") || len(txHash) != 66 {
		return fmt.Errorf("invalid BSC transaction hash")
	}
	var depositAddress string
	if err := s.db.QueryRow(ctx, `SELECT address FROM user_deposit_addresses WHERE user_id = $1`, userID).Scan(&depositAddress); err != nil {
		return fmt.Errorf("deposit address not found")
	}
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
	expectedUnits := new(big.Int)
	amountCents := strings.Replace(fmt.Sprintf("%.2f", expectedAmount), ".", "", 1)
	if _, ok := expectedUnits.SetString(amountCents, 10); !ok {
		return fmt.Errorf("invalid investment amount")
	}
	expectedUnits.Mul(expectedUnits, new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals-2)), nil))

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

type usdtService struct {
	db           *pgxpool.Pool
	auditService AuditService
}

func NewUSDTService(db *pgxpool.Pool, auditService AuditService) USDTService {
	return &usdtService{
		db:           db,
		auditService: auditService,
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

// GetOrCreateDepositAddress returns an existing derived BEP20 address or derives a new one on demand.
func (s *usdtService) GetOrCreateDepositAddress(ctx context.Context, userID uuid.UUID) (*domain.UserDepositAddress, error) {
	// Check existing address
	var addr domain.UserDepositAddress
	query := `SELECT id, user_id, address, derivation_index, created_at FROM user_deposit_addresses WHERE user_id = $1`
	err := s.db.QueryRow(ctx, query, userID).Scan(&addr.ID, &addr.UserID, &addr.Address, &addr.DerivationIndex, &addr.CreatedAt)
	if err == nil {
		return &addr, nil
	}

	// Calculate next index
	var nextIndex int
	idxQuery := `SELECT COALESCE(MAX(derivation_index), 0) + 1 FROM user_deposit_addresses`
	if err := s.db.QueryRow(ctx, idxQuery).Scan(&nextIndex); err != nil {
		nextIndex = 1
	}

	masterHex := os.Getenv("MASTER_PRIVATE_KEY")
	masterHex = strings.TrimPrefix(masterHex, "0x")
	var derivedAddress string

	if masterHex != "" {
		// Derive child bytes deterministically using keccak256
		childSeed := keccak256([]byte(masterHex), []byte(fmt.Sprintf("_user_%s_idx_%d", userID.String(), nextIndex)))
		childKey, err := hexToPrivateKey(hex.EncodeToString(childSeed))
		if err == nil {
			derivedAddress = pubkeyToAddress(&childKey.PublicKey)
		}
	}

	if derivedAddress == "" {
		// Fallback deterministic address generator
		hashBytes := keccak256([]byte(fmt.Sprintf("%s_%d", userID.String(), nextIndex)))
		derivedAddress = "0x" + hex.EncodeToString(hashBytes[12:])
	}

	// Save to DB
	insertQuery := `
		INSERT INTO user_deposit_addresses (id, user_id, address, derivation_index, created_at)
		VALUES (uuid_generate_v4(), $1, $2, $3, CURRENT_TIMESTAMP)
		RETURNING id, user_id, address, derivation_index, created_at
	`
	var newAddr domain.UserDepositAddress
	err = s.db.QueryRow(ctx, insertQuery, userID, derivedAddress, nextIndex).Scan(
		&newAddr.ID, &newAddr.UserID, &newAddr.Address, &newAddr.DerivationIndex, &newAddr.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Audit Log
	_ = s.auditService.Log(ctx, &userID, "GENERATE_DEPOSIT_ADDRESS", 0, 0, "", "SUCCESS", fmt.Sprintf(`{"address":"%s"}`, derivedAddress))

	return &newAddr, nil
}

// ProcessAutoWithdrawal executes automatic USDT transfer on BSC network using master private key from .env
func (s *usdtService) ProcessAutoWithdrawal(ctx context.Context, withdrawalID, userID uuid.UUID, recipientAddress string, amountUSD float64) (string, error) {
	masterHex := os.Getenv("MASTER_PRIVATE_KEY")
	masterHex = strings.TrimPrefix(masterHex, "0x")

	if masterHex == "" {
		return "", fmt.Errorf("MASTER_PRIVATE_KEY not configured in .env")
	}

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

	nonceHex, err := callBSC(ctx, rpcURL, "eth_getTransactionCount", []interface{}{fromAddress, "pending"})
	if err != nil {
		return "", err
	}
	gasPriceHex, err := callBSC(ctx, rpcURL, "eth_gasPrice", []interface{}{})
	if err != nil {
		return "", err
	}
	chainIDHex, err := callBSC(ctx, rpcURL, "eth_chainId", []interface{}{})
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
	chainID, ok := new(big.Int).SetString(strings.TrimPrefix(chainIDHex, "0x"), 16)
	if !ok {
		return "", fmt.Errorf("invalid BSC chain ID")
	}

	decimals := 18
	if raw := os.Getenv("USDT_DECIMALS"); raw != "" {
		if parsed, parseErr := strconv.Atoi(raw); parseErr == nil && parsed >= 2 && parsed <= 36 {
			decimals = parsed
		}
	}
	amountUnits := new(big.Int)
	amountCents := strings.Replace(fmt.Sprintf("%.2f", amountUSD), ".", "", 1)
	if _, ok := amountUnits.SetString(amountCents, 10); !ok {
		return "", fmt.Errorf("invalid payout amount")
	}
	amountUnits.Mul(amountUnits, new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(decimals-2)), nil))

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
		return "", fmt.Errorf("failed to broadcast payout transaction: %w", err)
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

// GetMasterWalletBalance reads the native BNB and BEP-20 USDT balances from BSC.
// It deliberately returns only the public address and balances, never the private key.
func (s *usdtService) GetMasterWalletBalance(ctx context.Context) (*MasterWalletBalance, error) {
	masterHex := strings.TrimPrefix(os.Getenv("MASTER_PRIVATE_KEY"), "0x")
	if masterHex == "" {
		return nil, fmt.Errorf("MASTER_PRIVATE_KEY not configured")
	}
	privKey, err := hexToPrivateKey(masterHex)
	if err != nil {
		return nil, fmt.Errorf("failed to parse master private key: %v", err)
	}
	address := pubkeyToAddress(&privKey.PublicKey)
	return s.getWalletBalance(ctx, address)
}

func (s *usdtService) GetDepositWalletBalance(ctx context.Context, userID uuid.UUID) (*MasterWalletBalance, error) {
	var address string
	err := s.db.QueryRow(ctx, `SELECT address FROM user_deposit_addresses WHERE user_id = $1`, userID).Scan(&address)
	if err != nil {
		return nil, fmt.Errorf("deposit wallet not found for user")
	}
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
	usdt, _ := new(big.Float).Quo(new(big.Float).SetInt(usdtUnits), big.NewFloat(1e18)).Float64()
	return &MasterWalletBalance{
		Address: address,
		BNB:     bnb,
		USDT:    usdt,
	}, nil
}

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
	resp, err := http.DefaultClient.Do(req)
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
	resp, err := http.DefaultClient.Do(req)
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
