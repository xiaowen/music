install:
	cp indicator.desktop /usr/share/applications/indicator-mpd.desktop
	cp indicator.py /usr/bin/indicator-mpd
	ln -sf /usr/share/applications/indicator-mpd.desktop ~/.config/autostart/
