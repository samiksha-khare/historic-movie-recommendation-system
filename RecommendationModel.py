#!/usr/bin/env python
# coding: utf-8

# Movie Recommender System - TMDB Dataset
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.sql import text
from urllib.parse import quote_plus
import pandas as pd
import numpy as np
import ast
import pickle
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
load_dotenv()

class RecommendationModel:
    def __init__(self):
        self.host = os.getenv('DB_HOST')
        self.user = os.getenv('DB_USER')
        self.database = os.getenv('DB_NAME')
        self.password = os.getenv('DB_PASSWORD')
        # self.movies_path = movies_path
        # self.credits_path = credits_path
        self.engine = self.create_db_connection()
        self.history_df = None
        self.movies_df = None
        self.movie_data = None
        self.cosine_sim_matrix = None
        self.recommendations = None

    def create_db_connection(self):
        password = quote_plus(str(self.password))
        engine = create_engine(f"mysql+mysqlconnector://{self.user}:{password}@{self.host}/{self.database}")
        return engine

    def fetch_historical_events(self):
        query = "SELECT id, name, region, description, start_year FROM Events;"
        events = pd.read_sql(query, con=self.engine)
        events.dropna(inplace=True)
        events['events_tags'] = events[['description', 'name', 'region', 'start_year']].agg(' '.join, axis=1)
        self.history_df = events.drop(columns=['start_year', 'region', 'description'])[['id', 'name', 'events_tags']]


    def fetch_movies(self):
        query = "SELECT id, title, overview FROM Movies;"
        movies = pd.read_sql(query, con=self.engine)
        movies.dropna(inplace=True)
        return movies

    def preprocess_movies(self, movies_df):
        # Work on a copy so we don’t mutate the caller’s DataFrame
        df = movies_df.copy()

        # Split into token lists, but keep the original title column intact
        df['title_tokens']    = df['title'].str.split()
        df['overview_tokens'] = df['overview'].str.split()

        # Combine the token lists and join with spaces to form the 'tags' string
        df['tags'] = (
            df['overview_tokens'] +
            df['title_tokens']
        ).apply(lambda words: " ".join(words))

        # Store only the id (or movie_id), the original title string, and the new tags
        self.movies_df = df[['id', 'title', 'tags']]


    def process_historical_events(self, events_df):
        df = events_df.copy()

        # split only for tags:
        df['events_tags'] = df.apply(
            lambda row: row['name'].split() +
                        row['region'].split() +
                        row['description'].split(),
            axis=1
        ).apply(lambda words: " ".join(words))

        self.history_df = df[['id','name','events_tags']]


    def build_similarity_matrix_cosine(self):
        all_tags = pd.concat([self.history_df['events_tags'], self.movies_df['tags']], axis=0)
        vectorizer = CountVectorizer(stop_words='english')
        count_matrix = vectorizer.fit_transform(all_tags)

        history_vectors = count_matrix[:len(self.history_df)]
        movies_vectors = count_matrix[len(self.history_df):]

        self.cosine_sim_matrix = cosine_similarity(history_vectors, movies_vectors)
        self.cosine_sim_matrix

    def build_similarity_matrix_tfidf(self,
                                ngram_range=(1,2),
                                min_df=2,
                                max_df=0.8):
        # concatenate tags (as before)
        all_tags = pd.concat([
            self.history_df['events_tags'],
            self.movies_df['tags']
        ], axis=0)

        # use TF–IDF with n-grams and document-frequency thresholds
        vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=ngram_range,
            min_df=min_df,
            max_df=max_df
        )
        tfidf_matrix = vectorizer.fit_transform(all_tags)

        # split back into history vs. movies
        history_vectors = tfidf_matrix[:len(self.history_df)]
        movies_vectors  = tfidf_matrix[len(self.history_df):]

        # cosine similarity on TF–IDF
        self.cosine_sim_matrix = cosine_similarity(history_vectors, movies_vectors)

    def generate_recommendations(self, top_n=5):
        if self.cosine_sim_matrix is None:
            raise ValueError("Call build_similarity_matrix() first.")

        recs = []
        for idx, history_event in self.history_df.iterrows():
            # get (movie_idx, similarity_score) pairs
            similar = list(enumerate(self.cosine_sim_matrix[idx]))
            # pick top N
            top = sorted(similar, key=lambda x: x[1], reverse=True)[:top_n]

            # build list of dicts with both id and title
            for movie_idx, score in top:
                recs.append({
                    "id":    int(self.movies_df.iloc[movie_idx]["id"]),
                    "title": self.movies_df.iloc[movie_idx]["title"]
                })

        self.recommendations = recs

    def insert_recommendations_to_db(self, event_id):
        if self.recommendations is None:
            raise ValueError("Recommendations not generated yet. Call generate_recommendations() first.")

        delete_q = text("DELETE FROM Events_Movies WHERE event_id = :event_id")
        insert_q = text(
            "INSERT INTO Events_Movies (event_id, movie_id) "
            "VALUES (:event_id, :movie_id)"
        )

        # .begin() will start a transaction and commit (or rollback on error) automatically
        with self.engine.begin() as conn:
            # remove old recommendations
            conn.execute(delete_q, {"event_id": int(event_id)})

            # insert new ones
            for rec in self.recommendations:
                conn.execute(
                    insert_q,
                    {"event_id": int(event_id), "movie_id": int(rec["id"])}
                )


    def get_top_movies_for_event(self, event_name):
        if self.recommendations is None:
            raise ValueError("Recommendations not generated yet. Call generate_recommendations() first.")
        return self.recommendations

    def save_pickle_files(self):
        pickle.dump(self.cosine_sim_matrix, open('eventsMovieSimilarity.pkl', 'wb'))
        pickle.dump(self.movie_data.to_dict(), open('newMovieDict.pkl', 'wb'))
        pickle.dump(self.history_df.to_dict(), open('newEventsDict.pkl', 'wb'))

# ============================ Main Execution ============================

    def main(self, history_event):
        # 1. Process historical events
        self.process_historical_events(history_event)

        # 2. Fetch movies from the database
        movies_df = self.fetch_movies()

        # 3. Preprocess movies
        self.preprocess_movies(movies_df)

        # 4. Compute similarity matrix between historic event and movies
        # self.build_similarity_matrix_cosine()
        self.build_similarity_matrix_tfidf()

        # 5. Generate recommendations
        self.generate_recommendations()

        # Save artifacts
        #recommender.save_pickle_files()

        # 6. Get and print top movies for the event
        event_name = self.history_df['name'].iloc[0]
        event_id = self.history_df['id'].iloc[0]
        top_movies = self.get_top_movies_for_event(event_name)
        print(f"Top 5 recommended movies for '{event_name}': {self.recommendations}")

        # 7. Insert recommendations into the database
        self.insert_recommendations_to_db(event_id)
