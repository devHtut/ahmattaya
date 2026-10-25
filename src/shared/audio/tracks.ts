import type { MusicTrackId } from '../models/music'

export interface MusicTrack {
  id: MusicTrackId
  title: string
  description: string
  mood: string
  src: string
  seconds: number
  credit: string
  license: string
}
export const musicTracks: MusicTrack[] = [
  {
    id: 'little-celebration',
    title: 'ပျော်ရွှင်စရာ နေ့လေး',
    description: 'Sparkling bell tunes for birthdays and festivals',
    mood: 'ပျော်ရွှင်',
    src: '/music/little-celebration.wav',
    seconds: 18,
    credit: 'AhMatTaYa original synthesized instrumental',
    license: 'CC0-1.0',
  },
  {
    id: 'soft-promise',
    title: 'နူးညံ့တဲ့ ကတိလေး',
    description: 'Gentle keys for wedding and special days',
    mood: 'နူးညံ့',
    src: '/music/soft-promise.wav',
    seconds: 25,
    credit: 'AhMatTaYa original synthesized instrumental',
    license: 'CC0-1.0',
  },
  {
    id: 'memory-evening',
    title: 'အမှတ်တရ ညနေခင်း',
    description: 'Arpeggio for anniversaries and memories',
    mood: 'အေးချမ်း',
    src: '/music/memory-evening.wav',
    seconds: 28,
    credit: 'AhMatTaYa original synthesized instrumental',
    license: 'CC0-1.0',
  },
]
export function findMusicTrack(id: string): MusicTrack | undefined {
  return musicTracks.find((track) => track.id === id)
}
