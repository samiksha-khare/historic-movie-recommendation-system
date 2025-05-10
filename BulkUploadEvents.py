#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from kafka import KafkaProducer
import re
import pandas as pd
import json
from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.sql import text
load_dotenv()

class EventUploader:
    def __init__(
        self,
        user: str,
        password: str,
        host: str,
        database: str,
        csv_path: str,
        table_name: str = "Events",
        kafka_bootstrap: list = None,
        kafka_topic: str = "topic-historic-data",
    ):

        self.user = user
        self.password = password
        self.host = host
        self.database = database
        self.csv_path = csv_path
        self.table_name = table_name
        self.kafka_bootstrap = kafka_bootstrap or ["localhost:9092"]
        self.kafka_topic = kafka_topic

    def create_db_connection(self):
        """
        Uses quote_plus to URL-encode the password, then
        returns a SQLAlchemy engine.
        """
        pw = quote_plus("Counter@1")
        print(pw)
        engine = create_engine(
            f"mysql+mysqlconnector://{self.user}:{pw}@{self.host}/{self.database}"
        )
        return engine

    @staticmethod
    def parse_year(val):
        """
        "2600 BC" → -2600, "Unknown" or NaN → None, "1526" → 1526
        """
        if pd.isna(val):
            return None
        s = str(val).strip().lower()
        if s == "unknown":
            return None
        m = re.search(r"(\d+)", s)
        if not m:
            return None
        year = int(m.group(1))
        return -year if "bc" in s else year

    def load_raw_csv(self) -> pd.DataFrame:
        """Reads the CSV into a DataFrame."""
        return pd.read_csv(self.csv_path)

    def transform_df(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        - Renames columns to match your Events table.
        - Parses start/end years.
        - Selects only the target columns.
        """
        df = df.rename(columns={
            "Name of Incident": "name",
            "Year":             "year_raw",
            "Country":          "region",
            "Impact":           "description",
        })

        # If wiki_description exists and isn’t empty, use it; otherwise keep the original description
        df["description"] = df.apply(
            lambda row: row["wiki_description"]
                        if pd.notna(row.get("wiki_description")) and row["wiki_description"].strip() != ""
                        else row["description"],
            axis=1
        )

        df["start_year"] = df["year_raw"].apply(self.parse_year)
        df["end_year"]   = df["start_year"]

        return df[[
            "name",
            "start_year",
            "end_year",
            "region",
            "description"
        ]].copy()

    def upload_to_db(self, df: pd.DataFrame) -> list[int]:
        engine = self.create_db_connection()
        inserted_ids = []
        with engine.begin() as conn:
            for rec in df.to_dict(orient="records"):
                # parameterized INSERT
                stmt = text(f"""
                  INSERT INTO {self.table_name}
                    (name, start_year, end_year, region, description)
                  VALUES
                    (:name, :start_year, :end_year, :region, :description)
                """)
                result = conn.execute(stmt, rec)
                inserted_ids.append(result.lastrowid)
        return inserted_ids

    def create_kafka_producer(self) -> KafkaProducer:
        """
        Constructs a KafkaProducer that serializes messages to JSON.
        """
        return KafkaProducer(
            bootstrap_servers=self.kafka_bootstrap,
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
       )

    def publish_events(self, df: pd.DataFrame):
        """
        Publish each event as a JSON message to Kafka.
        """
        producer = self.create_kafka_producer()
        for record in df.to_dict(orient="records"):
            producer.send(self.kafka_topic, value=record)
        producer.flush()  # ensure all messages are sent

    def run(self):
        raw       = self.load_raw_csv()
        events_df = self.transform_df(raw)

        # get back the auto‐incremented IDs
        new_ids = self.upload_to_db(events_df)
        events_df["id"] = new_ids

        print(f"Inserted {len(events_df)} rows…")
        self.publish_events(events_df)   # now each record has its `id`
        print(f"Published {len(events_df)} events to Kafka.")


if __name__ == "__main__":
    uploader = EventUploader(
        host = 'host.docker.internal',
        user = 'root',
        database = 'Historic_Milestones',
        password = os.getenv('DB_PASSWORD'),
        csv_path="World Important Dates enriched.csv",
        kafka_bootstrap=["host.docker.internal:9092"],
        kafka_topic="topic-historic-data",
    )
    uploader.run()
