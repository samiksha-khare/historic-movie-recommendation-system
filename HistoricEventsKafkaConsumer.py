from kafka import KafkaConsumer
from json import loads
import json
import pandas as pd
from sqlalchemy import create_engine
from urllib.parse import quote_plus
import logging
from RecommendationModel import RecommendationModel

# Configure logging
logging.basicConfig(level=logging.INFO)

consumer = KafkaConsumer(
    'topic-historic-data',
    bootstrap_servers=["host.docker.internal:9092"],
    value_deserializer=lambda x: loads(x.decode('utf-8'))
)

for message in consumer:
    try:
        # Extract and parse the JSON message
        logging.info("Successfully received event in the Kafka consumer: %s", message.value)
        data = message.value
        # Convert the JSON data to a DataFrame
        history_df = pd.DataFrame([data])
        # Extract movies from DB and run the recommendation model
        recommender = RecommendationModel()
        recommender.main(history_df)

    except Exception as e:
        logging.error("Error: %s", e)
        continue
