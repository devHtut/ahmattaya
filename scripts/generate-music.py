"""Reproduce original AhMatTaYa preset loops. No samples or external melodies.
Writes mono PCM WAV files; optional AAC encoding is documented in music/README.
Python standard library only. The generated audio is dedicated under CC0-1.0.
"""
from pathlib import Path
import math
import struct
import wave

RATE = 22050
OUTPUT = Path(__file__).resolve().parent.parent / 'public' / 'music'

def render(name, bpm, chords, melody, warmth):
    beat = 60 / bpm
    duration = 32 * beat
    count = int(duration * RATE)
    samples = [0.0] * count

    def note(midi, start, length, gain, bell=False):
        frequency = 440 * 2 ** ((midi - 69) / 12)
        begin = int(start * RATE)
        end = min(count, int((start + length) * RATE))
        for index in range(begin, end):
            t = (index - begin) / RATE
            attack = min(1, t / .018)
            release = min(1, max(0, (length - t) / .15))
            envelope = attack * release * math.exp(-t * (2.5 if bell else .8))
            value = math.sin(2 * math.pi * frequency * t)
            value += (.24 if bell else .12) * math.sin(2 * math.pi * frequency * 2 * t) * math.exp(-t * 1.7)
            value += .06 * math.sin(2 * math.pi * frequency * 3 * t)
            samples[index] += gain * envelope * value

    for bar in range(8):
        chord = chords[bar % len(chords)]
        start = bar * 4 * beat
        note(chord[0] - 12, start, 3.8 * beat, .12)
        for index in range(8):
            note(chord[index % len(chord)] + (12 if index % 4 == 3 else 0), start + index * beat / 2, 1.8 * beat, warmth)
        for offset, pitch, length in melody[bar % len(melody)]:
            note(pitch, start + offset * beat, length * beat, .13, True)

    peak = max(abs(value) for value in samples) or 1
    pcm = bytearray()
    for index, value in enumerate(samples):
        # Quiet boundaries avoid clicks when replaying the complete phrase.
        fade = min(1, index / (RATE * .08), (count - 1 - index) / (RATE * .7))
        pcm.extend(struct.pack('<h', round(value / peak * .72 * fade * 32767)))
    with wave.open(str(OUTPUT / f'{name}.wav'), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(pcm)
    print(f'{name}: {duration:.2f}s')

OUTPUT.mkdir(parents=True, exist_ok=True)
render('little-celebration', 104, [[60,64,67],[65,69,72],[57,60,64],[55,59,62]], [
    [(0,76,.75),(1,79,.75),(2,81,.5),(3,79,.75)],
    [(.5,77,.75),(1.5,81,.75),(3,84,.75)],
    [(0,76,1.5),(2,72,.75),(3,76,.75)],
    [(0,74,.75),(1,71,.75),(2,72,1.6)],
], .075)
render('soft-promise', 76, [[62,66,69],[59,62,66],[55,59,62],[57,61,64]], [
    [(0,78,1.5),(2,81,1.6)],
    [(.5,78,1.5),(2.5,74,1)],
    [(0,79,1.5),(2,78,.75),(3,74,.75)],
    [(0,76,1),(1.5,73,.75),(3,74,.8)],
], .065)
render('memory-evening', 68, [[60,64,67,71],[57,60,64,67],[65,69,72,76],[55,59,62,69]], [
    [(0,76,1.8),(2.5,74,1)],
    [(0,72,1.5),(2,71,1.5)],
    [(.5,69,1.5),(2.5,72,1)],
    [(0,74,1.5),(2,71,.75),(3,72,.9)],
], .06)
