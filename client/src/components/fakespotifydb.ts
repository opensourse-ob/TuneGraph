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
