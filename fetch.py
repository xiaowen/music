#!/usr/bin/python

# Download podcasts.
# Add the following crontab entry: 0 * * * * root /home/xiaowen/code/music/fetch.py &> /dev/null

from datetime import date, timedelta
from pdb import set_trace as st
import feedparser
import os
import subprocess


MUSIC_DIR = '/var/lib/mpd/music/'

# Determine whether the given file is recent.
def is_recent(name):
    for d in range(3):
        dstr = (date.today() - timedelta(days=d)).strftime('%Y%m%d')
        if dstr in name:
            return True
    return False

# Read sources.
sources = open('sources').readlines()

# Download them.
for source in sources:
    # Ignore lines that start with #.
    if source.startswith('#'):
        continue

    feed_data = feedparser.parse(source)

    for entry in feed_data.entries:
        link = entry['links'][-1]['href']

        # Only download mp3 files for now.
        if not link.endswith('mp3'):
            continue

        # Only download mp3 files that are within the last week.
        if not is_recent(link):
            continue

        subprocess.call(['wget', '-c', '-P', MUSIC_DIR, link])

# Delete old files.
files = os.listdir(MUSIC_DIR)
for f in files:
    # We'll only deal with mp3 files.
    if not f.endswith('.mp3'):
        continue

    # If not recent, then delete.
    if not is_recent(f):
        os.remove(os.path.join(MUSIC_DIR, f))

# Load in mpd
subprocess.call(['mpc', 'update'])
