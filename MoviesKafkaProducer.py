import os
from dotenv import load_dotenv
from kafka import KafkaProducer
import csv
import requests
import json
# Load environment variables from .env file
load_dotenv()

class PublishMovies:
    def __init__(self):
        self.topic = "topic-movie-data"
        self.KafkaProducer = KafkaProducer(
            bootstrap_servers="host.docker.internal:9092",
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )

    def get_movies(self, pages = [1,500]):
        if len(pages) == 1:
            pages.append(pages[0])
        for page in range(pages[0], pages[1]+1):
            print(f"---------------------------------------------\nReading page: {page}\n---------------------------------------------")

            url = f"https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page={page}&sort_by=popularity.desc&with_genres=10752%7C36"

            headers = {
                "accept": "application/json",
                "Authorization": f"Bearer {os.getenv('TMDB_API')}"
            }

            response = requests.get(url, headers=headers)
            movies = response.json()
            try:
                if movies['results'] == []:
                    print(f"❌ No movies found on page {page}")
                    continue
            except KeyError:
                print(f"❌ Error: {movies}")
                continue
            for movie in movies['results']:
                # If overview in moview == "We don't have an overview translated in English. Help us expand our database by adding one.", do not send
                if movie['overview'] == "We don't have an overview translated in English. Help us expand our database by adding one.":
                    print(f"❌ Skipping movie with no overview: {movie['title']}")
                    continue
                movie['page'] = page
                movieJson = json.dumps(movie)
                self.publish_movie(movieJson)

    def publish_movie(self, movieDetails):
        # Send the JSON string as a message to Kafka
        kafkaResponse = self.KafkaProducer.send(self.topic, value=movieDetails)
        # Force message to be sent and check for errors
        try:
            kafkaResponse.get(timeout=10)  # Blocks until Kafka acknowledges the message
            print(f"✅ Sent test message: {movieDetails}")
        except Exception as e:
            print(f"❌ Error sending message: {e}")
            print(f"Sent: {movieDetails}")

if __name__ == "__main__":
    movie = PublishMovies()
    movie.get_movies([1, 500])
