class Song:
    def __init__(self, id, title, artist, url, plays="0", duration="0", album="Single", date_added=None):
        self.id = id
        self.title = title
        self.artist = artist
        self.url = url
        self.plays = plays
        self.duration = duration
        self.album = album
        # Pokud datum existuje, převedeme ho na string, jinak None
        self.date_added = str(date_added) if date_added else None

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "artist": self.artist,
            "url": self.url,
            "plays": self.plays,
            "duration": self.duration,
            "album": self.album,
            "date_added": self.date_added
        }