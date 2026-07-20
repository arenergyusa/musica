package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"

	_ "github.com/lib/pq"
)

func main() {
	connStr := "postgres://musica:musica_password@127.0.0.1:5432/musica_db?sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Read migration file
	content, err := ioutil.ReadFile("/home/admin1/musica/backend/migrations/000004_dynamic_investments.up.sql")
	if err != nil {
		log.Fatal("Error reading migration:", err)
	}

	// Execute migration
	_, err = db.Exec(string(content))
	if err != nil {
		// Might fail if already exists, that's fine
		fmt.Println("Migration output (might already exist):", err)
	} else {
		fmt.Println("Migration applied successfully.")
	}

	// Verify columns
	rows, err := db.Query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'investments'")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("investments table schema:")
	for rows.Next() {
		var name, dtype string
		if err := rows.Scan(&name, &dtype); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("- %s (%s)\n", name, dtype)
	}
}
