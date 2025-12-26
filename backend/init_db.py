"""Database initialization script."""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()


def init_database():
    """Initialize the database with schema."""
    # Database configuration
    config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', 5432),
        'database': os.getenv('DB_NAME', 'mermaid_editor'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', '')
    }

    try:
        # Connect to PostgreSQL server (not to specific database)
        conn = psycopg2.connect(
            host=config['host'],
            port=config['port'],
            user=config['user'],
            password=config['password'],
            database='postgres'
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (config['database'],)
        )
        exists = cursor.fetchone()

        if not exists:
            print(f"Creating database '{config['database']}'...")
            cursor.execute(f"CREATE DATABASE {config['database']}")
            print(f"Database '{config['database']}' created successfully!")
        else:
            print(f"Database '{config['database']}' already exists.")

        cursor.close()
        conn.close()

        # Connect to the specific database
        conn = psycopg2.connect(**config)
        cursor = conn.cursor()

        # Read and execute schema.sql
        print("Executing schema.sql...")
        with open('schema.sql', 'r') as f:
            schema_sql = f.read()
            cursor.execute(schema_sql)

        conn.commit()
        print("Database schema created successfully!")

        cursor.close()
        conn.close()

        print("\n✅ Database initialization completed!")
        print(f"Database: {config['database']}")
        print(f"Host: {config['host']}")
        print(f"Port: {config['port']}")

    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        raise


if __name__ == '__main__':
    print("Initializing database...")
    init_database()
