import os
from dotenv import load_dotenv
load_dotenv()
from kafka import KafkaConsumer
from json import loads
import json
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy import text
from urllib.parse import quote_plus
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Use host.docker.internal for Docker-to-host communication
host = os.getenv('DB_HOST')
user = os.getenv('DB_USER')
database = os.getenv('DB_NAME')
password = quote_plus(str(os.getenv('DB_PASSWORD')))

# Create a SQLAlchemy engine for MySQL
engine = create_engine(f"mysql+mysqlconnector://{user}:{password}@{host}/{database}")

consumer = KafkaConsumer(
    'topic-movie-data',
    bootstrap_servers=["host.docker.internal:9092"],
    value_deserializer=lambda x: loads(x.decode('utf-8'))
)

for message in consumer:
    try:
        # Extract and parse the JSON message
        json_str = message.value
        json_movie_data = json.loads(json_str)  # Convert string to dictionary

        movie_data = {
            'id': json_movie_data.get("id"),
            'title': json_movie_data.get("title", ""),
            'release_date': json_movie_data.get("release_date", ""),
            'overview': json_movie_data.get("overview", ""),
            'poster_path': json_movie_data.get("poster_path", ""),
            'page': json_movie_data.get("page", -1),
        }

        insert_sql = text("""
        INSERT IGNORE INTO Movies
           (id, title, release_date, overview, poster_path, page)
        VALUES
           (:id, :title, :release_date, :overview, :poster_path, :page)
        """)

        with engine.begin() as conn:
            # pass movie_data dict as the params argument
            conn.execute(insert_sql, movie_data)
            logging.info("Tried inserting movie: %s", movie_data["title"])

    except Exception as e:
        logging.error("Error inserting into SQL: %s", e)
        # Optionally, log additional details or perform further error handling here
        continue
