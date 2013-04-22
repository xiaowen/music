#!/usr/bin/python

# Download podcasts.
# Add the following crontab entry: 0 * * * * root /home/xiaowen/code/music/fetch.py &> /dev/null

from datetime import date, timedelta
from pdb import set_trace as st
import feedparser
import os
import subprocess

def download_mp3s():
    MUSIC_DIR = '/var/lib/mpd/music/'

    # Determine whether the given file is recent.
    def is_recent(name, fmt=None, updated=None):
        if not fmt:
            fmt = '_%Y%m%d.mp3'

        for d in range(3):
            day = date.today() - timedelta(days=d)
            dstr = day.strftime(fmt)
            if dstr in name or (updated and dstr in updated):
                return day.strftime('%Y%m%d')
        return False

    # Read sources.
    sources = open(os.path.join(os.path.dirname(__file__), 'sources')).readlines()

    # Download them.
    for source in sources:
        # Ignore lines that start with #.
        if source.startswith('#'):
            continue

        source, fmt, prefix = source.strip().split('\t')

        feed_data = feedparser.parse(source)

        for entry in feed_data.entries:
            try:
                link = entry['links'][-1]['href']
            except KeyError:
                continue

            # Only download mp3 files for now.
            if not link.endswith('mp3'):
                continue

            # Only download mp3 files that are within the last week.
            dstr = is_recent(link, fmt, entry.get('updated'))
            if not dstr:
                continue

            link2 = '%s_%s_%s.mp3' % (prefix, link.rsplit('/', 1)[-1][:-4], dstr)
            subprocess.call(['wget', '-c', '-O', os.path.join(MUSIC_DIR, link2), link])

    # Delete old files and recreate mpd playlist.
    subprocess.call(['mpc', 'clear'])
    subprocess.call(['mpc', 'update'])
    files = os.listdir(MUSIC_DIR)
    for f in files:
        # We'll only deal with mp3 files.
        if not f.endswith('.mp3'):
            continue

        # If not recent, then delete.
        if not is_recent(f):
            full_path = os.path.join(MUSIC_DIR, f)
            print 'deleting %s' % (full_path)
            os.remove(full_path)

        # Add to playlist.
        subprocess.call(['mpc', 'add', f])

    # Refresh mpd
    subprocess.call(['mpc', 'update'])

if __name__ == '__main__':
    download_mp3s()
