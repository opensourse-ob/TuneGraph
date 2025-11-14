export const mockTopArtists = {
  time_range: 'medium_term',
  items: [
    {
      rank: 1,
      name: 'The Weeknd',
      id: '1Xyo4u8uXC1jMvZMLHfHgw',
      genres: ['R&B', 'pop', 'contemporary R&B'],
      images: [
        {
          url: 'https://i.scdn.co/image/ab6761610000e5eb3a78d4a6e3e3a8e4c8e8e8e8',
          height: 640,
          width: 640,
        },
        {
          url: 'https://i.scdn.co/image/ab676161000051743a78d4a6e3e3a8e4c8e8e8e8',
          height: 320,
          width: 320,
        },
        {
          url: 'https://i.scdn.co/image/ab6761610000f1783a78d4a6e3e3a8e4c8e8e8e8',
          height: 160,
          width: 160,
        },
      ],
      popularity: 95,
      external_urls: {
        spotify: 'https://open.spotify.com/artist/1Xyo4u8uXC1jMvZMLHfHgw',
      },
      plays: 1026, // Note: Spotify API doesn't provide this, you'd need to calculate it
    },
    {
      rank: 2,
      name: 'Taylor Swift',
      id: '06HL4z0CvFAxyc27GXpf02',
      genres: ['Pop', 'pop country', 'country pop'],
      images: [
        {
          url: 'https://i.scdn.co/image/ab6761610000e5ebecd5f617e55c8a8e4c8e8e8e8',
          height: 640,
          width: 640,
        },
      ],
      popularity: 100,
      external_urls: {
        spotify: 'https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02',
      },
      plays: 894,
    },
    {
      rank: 3,
      name: 'Drake',
      id: '3TVXtAsR1Inumwj472S9r4',
      genres: ['Hip-Hop', 'rap', 'canadian hip-hop'],
      images: [
        {
          url: 'https://i.scdn.co/image/ab6761610000e5eb3a78d4a6e3e3a8e4c8e8e8e8',
          height: 640,
          width: 640,
        },
      ],
      popularity: 98,
      external_urls: {
        spotify: 'https://open.spotify.com/artist/3TVXtAsR1Inumwj472S9r4',
      },
      plays: 828,
    },
    {
      rank: 4,
      name: 'Billie Eilish',
      id: '6qqNVTkY8uBg9cP3Jd7DAH',
      genres: ['Alternative', 'indie pop', 'alt-pop'],
      images: [
        {
          url: 'https://i.scdn.co/image/ab6761610000e5eb3a78d4a6e3e3a8e4c8e8e8e8',
          height: 640,
          width: 640,
        },
      ],
      popularity: 96,
      external_urls: {
        spotify: 'https://open.spotify.com/artist/6qqNVTkY8uBg9cP3Jd7DAH',
      },
      plays: 762,
    },
    {
      rank: 5,
      name: 'Post Malone',
      id: '246dkjvS1zLTtiykXe5h60',
      genres: ['Hip-Hop', 'rap', 'pop rap'],
      images: [
        {
          url: 'https://i.scdn.co/image/ab6761610000e5eb3a78d4a6e3e3a8e4c8e8e8e8',
          height: 640,
          width: 640,
        },
      ],
      popularity: 94,
      external_urls: {
        spotify: 'https://open.spotify.com/artist/246dkjvS1zLTtiykXe5h60',
      },
      plays: 654,
    },
  ],
}

export const mockTopSongs = {
  time_range: 'medium_term',
  items: [
    {
      rank: 1,
      name: 'Push The Tempo',
      artist: 'Sub Focus, Katy B',
      albumCover:
        'https://i.scdn.co/image/ab67616d0000b27331381dd82998702bbcfe30d9',
    },
    {
      rank: 2,
      name: 'Blinding Lights',
      artist: 'The Weeknd',
      albumCover:
        'https://i.scdn.co/image/ab67616d0000b273e4c00b1b22c9a6e8b8b92e56',
    },
    {
      rank: 3,
      name: 'Bad Habit',
      artist: 'Steve Lacy',
      albumCover:
        'https://i.scdn.co/image/ab67616d0000b2731f63a0b2d9f25a7d1e4f57a9',
    },
    {
      rank: 4,
      name: 'Watermelon Sugar',
      artist: 'Harry Styles',
      albumCover:
        'https://i.scdn.co/image/ab67616d0000b273d38a5108eaf2bde4f99864c4',
    },
    {
      rank: 5,
      name: 'Lose Yourself',
      artist: 'Eminem',
      albumCover:
        'https://i.scdn.co/image/ab67616d0000b2731a2e9eecf9bdf45b3d6b8f45',
    },
    {
      rank: 6,
      name: 'Levitating',
      artist: 'Dua Lipa',
      albumCover:
        'https://i.scdn.co/image/ab67616d0000b2735c51d45cb49f46c4b6f2578a',
    },
    {
      rank: 7,
      name: 'Heat Waves',
      artist: 'Glass Animals',
      albumCover:
        'https://i.scdn.co/image/ab67616d0000b273abc5b15a4c1d5a2f18e64cd9',
    },
    {
      rank: 8,
      name: 'As It Was',
      artist: 'Harry Styles',
      albumCover:
        'https://i.scdn.co/image/ab67616d0000b27321f9a8e4b2f8b6a6e82a16e3',
    },
    {
      rank: 9,
      name: 'Stay',
      artist: 'The Kid LAROI, Justin Bieber',
      albumCover:
        'https://i.scdn.co/image/ab67616d0000b2732a04e6bca5c75bb9e63c75a9',
    },
    {
      rank: 10,
      name: 'Flowers',
      artist: 'Miley Cyrus',
      albumCover:
        'https://i.scdn.co/image/ab67616d0000b273b31b1a84b5cdeae28b2dfbe8',
    },
  ],
}
