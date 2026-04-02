import os
import mysql.connector
from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_cors import CORS
from ReadConfig import ReadConfig

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

db_config = ReadConfig.read_database_config()

@app.route('/')
def index():
    """Naservíruje index.html ze složky templates."""
    return render_template('index.html')

@app.route('/<path:path>')
def send_static(path):
    """Zajistí přístup k souborům jako script.js přímo v src."""
    return send_from_directory('.', path)

@app.route('/music/<path:filename>')
def serve_music(filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    music_folder = os.path.abspath(os.path.join(current_dir, '..', 'music'))
    return send_from_directory(music_folder, filename)


@app.route('/api/songs', methods=['GET'])
def get_songs():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        sql = """
            select s.id, s.title, s.url, s.duration, s.plays, s.date_added, s.artist_id,
                   a.name as artist, al.title as album
            from songs s
            left join artists a on s.artist_id = a.id
            left join albums al on s.album_id = al.id
        """
        cursor.execute(sql)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/songs/favorites', methods=['GET'])
def get_favorites():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        sql = """
            select s.id, s.title, s.url, s.duration, s.plays, ps.date_added, s.artist_id,
                   a.name as artist, al.title as album
            from songs s
            left join artists a on s.artist_id = a.id
            left join albums al on s.album_id = al.id
            join playlist_songs ps on s.id = ps.song_id
            where ps.playlist_id = 1
        """
        cursor.execute(sql)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/playlists/<int:playlist_id>/songs', methods=['GET'])
def get_playlist_songs(playlist_id):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        sql = """
            select s.id, s.title, s.url, s.duration, s.plays, ps.date_added, s.artist_id,
                   a.name as artist, al.title as album
            from songs s
            left join artists a on s.artist_id = a.id
            left join albums al on s.album_id = al.id
            join playlist_songs ps on s.id = ps.song_id
            where ps.playlist_id = %s
        """
        cursor.execute(sql, (playlist_id,))
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/artists/<int:artist_id>/songs', methods=['GET'])
def get_artist_songs(artist_id):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        sql = """
            select s.id, s.title, s.url, s.duration, s.plays, s.date_added, s.artist_id,
                   a.name as artist, al.title as album
            from songs s
            left join artists a on s.artist_id = a.id
            left join albums al on s.album_id = al.id
            where s.artist_id = %s
        """
        cursor.execute(sql, (artist_id,))
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/songs/<int:song_id>/play', methods=['POST'])
def increment_play_count(song_id):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        sql = "update songs set plays = plays + 1 where id = %s"
        cursor.execute(sql, (song_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Počítadlo aktualizováno"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/playlists', methods=['GET'])
def get_playlists():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("select * from playlists")
        playlists = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(playlists)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/playlists', methods=['POST'])
def create_playlist():
    try:
        data = request.json
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("insert into playlists (name) values (%s)", (data['name'],))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Playlist vytvořen"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/playlists/<int:playlist_id>/add', methods=['POST'])
def add_to_playlist(playlist_id):
    try:
        data = request.json
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("insert into playlist_songs (playlist_id, song_id, date_added) values (%s, %s, curdate())",
                       (playlist_id, data['song_id']))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Přidáno do playlistu"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/playlists/<int:playlist_id>/remove', methods=['POST'])
def remove_from_playlist(playlist_id):
    try:
        data = request.json
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("delete from playlist_songs where playlist_id = %s and song_id = %s",
                       (playlist_id, data['song_id']))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Odebráno z playlistu"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/playlists/<int:playlist_id>/rename', methods=['PUT'])
def rename_playlist(playlist_id):
    try:
        data = request.json
        new_name = data.get('name')
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("update playlists set name = %s where id = %s", (new_name, playlist_id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Playlist přejmenován"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/playlists/<int:playlist_id>', methods=['DELETE'])
def delete_playlist(playlist_id):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("delete from playlists where id = %s", (playlist_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Playlist smazán"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)