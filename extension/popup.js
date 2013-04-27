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

function play(link) {
    chrome.runtime.getBackgroundPage(function(backgroundPage) {
        $(backgroundPage.document).find('audio').attr('src', link);
    });
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

    //$('#tabs').tabs().tabs('refresh');
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
});
