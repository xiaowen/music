var feeds = [
    'http://downloads.bbc.co.uk/podcasts/worldservice/globalnews/rss.xml',
    'http://downloads.bbc.co.uk/podcasts/worldservice/wbnews/rss.xml'
];
var streams = [
    ['http://dradio-ogg-dlf-l.akacast.akamaistream.net/7/629/135496/v1/gnl.akacast.akamaistream.net/dradio_ogg_dlf_l',
        'Deutschlandfunk'],
    ['http://dradio-ogg-dkultur-l.akacast.akamaistream.net/7/978/135496/v1/gnl.akacast.akamaistream.net/dradio_ogg_dkultur_l',
        'Deutschlandradio Kultur'],
    ['http://dradio-ogg-dwissen-l.akacast.akamaistream.net/7/192/135496/v1/gnl.akacast.akamaistream.net/dradio_ogg_dwissen_l',
        'DRadio Wissen']
];

// http://stackoverflow.com/questions/6312993/javascript-seconds-to-time-with-format-hhmmss
String.prototype.toHHMMSS = function () {
    sec_numb    = parseInt(this, 10); // don't forget the second parm
    var hours   = Math.floor(sec_numb / 3600);
    var minutes = Math.floor((sec_numb - (hours * 3600)) / 60);
    var seconds = sec_numb - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time    = hours+':'+minutes+':'+seconds;
    return time;
}

function play(link) { chrome.runtime.getBackgroundPage(function(backgroundPage) {
        $(backgroundPage.document).find('audio').attr('src', link);
    });

    // Enable all buttons.
    $('#play-pause').removeAttr('disabled');
    $('#seek-bar').removeAttr('disabled');
    $('#mute').removeAttr('disabled');
    $('#volume-bar').removeAttr('disabled');
}

// Update the i'th tab.
function update(i) {
    var feed = feeds[i];
    var saved = JSON.parse(localStorage[feed]);

    var episodes = $(saved[1]);
    var meta = saved[2];

    // Add in the title.
    $('#tabs-' + i + '>h2').replaceWith('<h2>' + meta['title'] + '</h2>');
    $('#tabs>ul>li:eq(' + i + ')>a').text(meta['title']);

    // Create selectable lists.
    var players = '';
    for(var j=0; j < episodes.length; j++) {
        var epi = episodes[j];
        players += '<li class="ui-widget-content">' + epi['title'] + '</li>';
    }

    $('#tabs-' + i + '>ol').replaceWith('<ol class="selectable">' + players + '</ol>');

    // Make them all selectable.
    $(function() {
        $('#tabs-' + i + '>.selectable').selectable({
            selected: function(event, ui) {
                var epi = episodes[$(ui.selected).index()];
                play(epi['link']);
            }
        });
    });
}

function download(i) {
    var feed = feeds[i];
    var jqxhr = $.get(feed);
    jqxhr.done(function(data) {
        $data = $(data);

        // Parse episodes.
        var episodes = [];
        $data.find('item').each(function(j, item) {
            $item = $(item);
            var item_data = {};
            var kvs = [ ['desc', 'description'], ['link', 'link'], ['title', 'title'] ];
            for(var k in kvs) {
                var key = kvs[k][0];
                var val = kvs[k][1];
                item_data[key] = $item.find(val).text();
            }
            episodes[episodes.length] = item_data;
        });

        // Parse metadata;
        var meta = {};
        meta['title'] = $data.find('channel > title').text();

        // Store this data as a JSON string.
        localStorage[feed] = JSON.stringify([new Date(), episodes, meta]);
        update(i);
    });
    jqxhr.fail(function() {
        console.log('failed?');
    });
}

$(document).ready(function() {
    // Clear it.
    $('#tabs>ul').empty();
    $('#tabs>div').remove();
    
    // Start updating all the feeds.
    for(var i = 0; i < feeds.length; i++) {
        $('#tabs>ul').append('<li><a href="#tabs-' + i + '">' + i + '</a></li>');
        $('#tabs').append('<div id="tabs-' + i + '"><h2>' + i + '</h2><ol class="selectable"></ol></div>');


        var feed = feeds[i];
        var saved = localStorage[feed];
        if(!saved) {
            download(i);
        } else {
            save_date = new Date(Date.parse(saved[0]));
            if(isNaN(save_date.getTime())) {
                download(i);
            }
            // TODO: if save_date is too early, then download again.
        }
    }

    // Handle the streams.
    for(var i = 0; i < streams.length; i++) {
        var j = i + feeds.length;
        $('#tabs>ul').append('<li><a href="#tabs-' + j + '">' + streams[i][1] + '</a></li>');
        $('#tabs').append('<div id="tabs-' + j + '"><h2>' + streams[i][1] + '</h2></div>');
    }

    $(function() {
        $( "#tabs" ).tabs().addClass( "ui-tabs-vertical ui-helper-clearfix" );
        $( "#tabs li" ).removeClass( "ui-corner-top" ).addClass( "ui-corner-left" );
    });

    $("#tabs").on( "tabsactivate", function( event, ui ) {
        // If it's a stream, then play it directly.
        var j = ui.newTab.index() - feeds.length;
        if(j >= 0) {
            play(streams[j][0]);
        }
    });

    // Bind to all the controls.
    $('#play-pause').click(function() {
        chrome.runtime.getBackgroundPage(function(backgroundPage) {
            var player = $(backgroundPage.document).find('audio').get(0);
            if(player.paused) {
                player.play();
            } else {
                player.pause();
            }
        });
    });
 
    $('#seek-bar').on('change', function() {
        chrome.runtime.getBackgroundPage(function(backgroundPage) {
            var player = $(backgroundPage.document).find('audio').get(0);
            player.currentTime = $('#seek-bar').get(0).value;
        });
    });
    $('#mute').click(function() {
    });
    $('#volume-bar').click(function() {
    });

    // Listen to all audio events.
    chrome.runtime.getBackgroundPage(function(backgroundPage) {
        $player = $(backgroundPage.document).find('audio');
        player = $player.get(0);
        $player.on('durationchange', function(x, y, z) {
            console.log();
        });
        $player.on('ended', function(x, y, z) {
            $('#play-pause').text('Play')
        });
        $player.on('pause', function(x, y, z) {
            $('#play-pause').text('Play')
        });
        $player.on('play', function(x, y, z) {
            $('#play-pause').text('Pause')
        });
        $player.on('timeupdate', function(ev) {
            var left = 0;
            var done = 0;
            var duration = 0;
            if(!isNaN(player.currentTime) && !isNaN(player.duration)) {
                done = player.currentTime;
                duration = player.duration;
                left = duration - done;
            }
            var seeker = $('#seek-bar').get(0);
            seeker.min = 0;
            seeker.max = duration;
            seeker.value = done;
            $('#player-done').text(done.toString().toHHMMSS());
            $('#player-left').text(left.toString().toHHMMSS());
        });
        $player.on('volumechange', function(x, y, z) {
            console.log();
        });
    });

    // Set state of the buttons based on state of player.
    chrome.runtime.getBackgroundPage(function(backgroundPage) {
        if($(backgroundPage.document).find('audio').attr('src') != '') {
            $('#play-pause').removeAttr('disabled');
            $('#seek-bar').removeAttr('disabled');
            $('#mute').removeAttr('disabled');
            $('#volume-bar').removeAttr('disabled');
        }
    });
});
