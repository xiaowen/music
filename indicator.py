#!/usr/bin/env python
import appindicator
import gtk
import imaplib
import re
import sys
import subprocess


# Initially copied from: http://conjurecode.com/create-indicator-applet-for-ubuntu-unity-with-python/
class AudioIndicator:
    def __init__(self):
        self.ind = appindicator.Indicator("audio-indicator", "audio-indicator", appindicator.CATEGORY_APPLICATION_STATUS)
        self.ind.set_status(appindicator.STATUS_ACTIVE)

        self.menu_setup()
        self.ind.set_menu(self.menu)

    def menu_setup(self):
        self.menu = gtk.Menu()

        self.quit_item = gtk.MenuItem("Quit")
        self.quit_item.connect("activate", self.quit)
        self.quit_item.show()
        self.menu.append(self.quit_item)

    def loop(self):
        gtk.timeout_add(10*1000, self.loop)

        output = subprocess.check_output(["mpc", "-f", "%title%\t%time%"])
        if output and '\t' in output:
            title = output.split('\n')[0]
            title, time = title.rsplit('\t', 1)
            if len(title) > 30:
                title = title[:27] + '...'
            title += ' - ' + time
        else:
            title = ''
        self.ind.set_label(title)

    def main(self):
        self.loop()
        gtk.main()

    def quit(self, widget):
        sys.exit(0)


if __name__ == "__main__":
    indicator = AudioIndicator()
    indicator.main()
