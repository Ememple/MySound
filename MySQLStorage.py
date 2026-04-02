import mysql.connector
import logging
from src.Song import Song

logger = logging.getLogger(__name__)

class MysqlStorage():
    instance = None

    def __new__(cls, *args, **kwargs):
        if not cls.instance:
            cls.instance = super(MysqlStorage, cls).__new__(cls)
        return cls.instance

    def __init__(self, db_config):
        if not getattr(self, 'initialized', False):
            self.db_config = db_config
            try:
                self._init_db()
                self.initialized = True
            except Exception as e:
                logger.error(f"Chyba při inicializaci DB: {e}")
                raise

    def _get_connection(self):
        return mysql.connector.connect(**self.db_config)

    def _init_db(self):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS songs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                artist VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                plays VARCHAR(50) DEFAULT '0',
                duration VARCHAR(10) DEFAULT '0:00'
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()

    def get_all_songs(self):
        conn = self._get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM songs")
        results = cursor.fetchall()
        cursor.close()
        conn.close()

        return [Song(**row) for row in results]