create database music;
use music;

create table artists (
    id int auto_increment primary key,
    name varchar(255) not null unique
);

create table albums (
    id int auto_increment primary key,
    title varchar(255) not null,
    artist_id int,
    foreign key (artist_id) references artists(id) on delete cascade
);

create table songs (
    id int auto_increment primary key,
    title varchar(255) not null,
    url text not null,
    duration varchar(10) default '0:00',
    plays int default 0,
    date_added date,
    artist_id int,
    album_id int,
    foreign key (artist_id) references artists(id) on delete restrict,
    foreign key (album_id) references albums(id) on delete set null
);

create table playlists (
    id int auto_increment primary key,
    name varchar(255) not null
);

create table playlist_songs (
    playlist_id int,
    song_id int,
    date_added date,
    primary key (playlist_id, song_id),
    foreign key (playlist_id) references playlists(id) on delete cascade,
    foreign key (song_id) references songs(id) on delete cascade
);


insert into artists (name) values 
('Michael Jackson'), 
('TV Girl'), 
('Viktor Sheen');

insert into albums (title, artist_id) values 
('Off the Wall', 1),
('French Exit', 2),
('Černobílej Svět', 3);

insert into songs (title, url, duration, date_added, artist_id, album_id) values 
(
    'Rock with You', 
    'http://127.0.0.1:5000/music/Rock_with_You-Michael_Jackson.mp3',
    '3:33', 
    curdate(), 
    1, 1
),
(
    'Lovers Rock', 
    'http://127.0.0.1:5000/music/Lovers_Rock-TV_Girl.mp3', 
    '3:00', 
    curdate(), 
    2, 2
),
(
    'Mráz', 
    'http://127.0.0.1:5000/music/Mraz-Viktor_Sheen.mp3', 
    '3:40', 
    curdate(), 
    3, 3
);

insert ignore into playlists (id, name) values (1, 'Oblíbené');