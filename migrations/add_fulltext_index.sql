-- One-time migration: Add FULLTEXT index on Movies table for natural language search
ALTER TABLE Movies ADD FULLTEXT INDEX ft_movies_search (title, overview);
