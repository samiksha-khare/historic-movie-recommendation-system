import time
from kafka.admin import KafkaAdminClient, NewTopic
from kafka.errors import KafkaError

def create_kafka_topics(bootstrap_servers, topics, num_partitions=1, replication_factor=1):
    """
    Create Kafka topics using kafka-python.

    :param bootstrap_servers: Kafka broker address (inside Docker: 'historic-movie-kafka:9092').
    :param topics: List of topic names to create.
    :param num_partitions: Number of partitions for each topic.
    :param replication_factor: Replication factor for each topic.
    """
    for _ in range(10):  # Retry for 10 seconds
        try:
            admin_client = KafkaAdminClient(bootstrap_servers=bootstrap_servers)
            topic_list = [
                NewTopic(name=topic, num_partitions=num_partitions, replication_factor=replication_factor)
                for topic in topics
            ]
            admin_client.create_topics(new_topics=topic_list, validate_only=False)
            print(f"✅ Topics created successfully: {', '.join(topics)}")
            admin_client.close()
            return
        except KafkaError as e:
            print(f"🔄 Waiting for Kafka to be available... {e}")
            time.sleep(2)  # Wait for Kafka to be ready

    print("❌ Error: Kafka broker not available. Exiting.")

# Kafka Config (Docker service name)
bootstrap_servers = "historic-movie-kafka:9092"
topics = ["topic-movie-data", "topic-historic-data"]

# Create the Kafka topic
create_kafka_topics(bootstrap_servers, topics)
