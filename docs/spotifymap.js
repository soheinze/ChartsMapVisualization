// Karte mit bestimmtem Mittelpunkt und Zoom-Eigenschaften erzeugen
var laengenGrad = 69.500;
var breitenGrad = 35.500;
var kartenMittelpunktKoordinaten = [breitenGrad, laengenGrad];
var zoomStufe = 1.5;
var karte = L.map('Karte', {
  zoomControl: true,
  minZoom: 2,
  maxZoom: 4
}).setView(kartenMittelpunktKoordinaten, zoomStufe);
karte.touchZoom.disable();
karte.doubleClickZoom.disable();
karte.scrollWheelZoom.disable();
karte.boxZoom.disable();
karte.keyboard.disable();

// Hintergrundkarte setzen
L.tileLayer.provider('Esri.WorldGrayCanvas').addTo(karte);

$.ajaxSetup({
  scriptCharset: "utf-8",
  contentType: "application/json; charset=utf-8"
});

//Variablen initialisieren
var geojsonEbene = undefined;
var gemerktesZuletztGewaehltesLand = 'Global';
var auswahlAenderung = true;
var festerWertebereich = true;
var clicked_feature = 'tempo';

//Funktion ebenenStil -> verwendet in initialisiereGeoJsonEbene()
//Beeinflusst die Farbfüllung der Länderpolygone
var ebenenStil = function(feature) {
  //Grundsätzlich alle Polygone erstmal mit Opacity 0.3
  var fillOpacityToUse = 0.3;
  var colorToUse = '#1DB954'
  //nutzt Funktion gewaehltesLand()-> Auswahl in der Box, um Polygon zu bestimmen
  var aktuellGewaehltesLand = gewaehltesLand()
  //Bei Click auf das Land = Hervorhebung und Auswahl in der Box statt default "Alle"
  //properties.name -> Ländernamen im laender.json
  if (feature.properties.name == aktuellGewaehltesLand) {
    fillOpacityToUse = 1.0,
      colorToUse = '#1DB954';

  }
  return {
    // https://developer.spotify.com/branding-guidelines/
    fillColor: colorToUse,
    weight: 1.2,
    opacity: 0.8,
    color: '#191414',
    fillOpacity: fillOpacityToUse
  };
}
//Ende Funktion ebenenStil

//Funktion Reaktion auf Landauswahl in Karte
var reagiereAufLandAuswahl = function() {
  var auswahlBox = document.getElementById("landAuswahl");
  //Setzen von Variablen für neue initialisierung von GeoJsonEbene
  if (auswahlBox && auswahlBox.selectedIndex != -1) {
    var gewaehltesLandIndex = auswahlBox.options[auswahlBox.selectedIndex].value;
    var gewaehltesLandName = auswahlBox.options[auswahlBox.selectedIndex].text;
    //Update der Variablen => neue GeoJsonEbene
    gemerktesZuletztGewaehltesLand = gewaehltesLandName;
    if (gemerktesZuletztGewaehltesLand != "") {
      karte.removeLayer(geojsonEbene);
      auswahlAenderung = true;
      initialisiereGeoJsonEbene();
    }
  }
};

//Funktion Reaktion auf Werteauswahl in Box
var reagiereAufWertebereichAuswahl = function(clicked_id) {
  //Zugriff auf die Button Id und Variablenzuweisung für Diagrammänderung in erstelleDiagramm
  clicked_feature = clicked_id;
  //console.log(clicked_feature);
  festerWertebereich = !festerWertebereich;
  karte.removeLayer(geojsonEbene);
  auswahlAenderung = true;
  initialisiereGeoJsonEbene();
};

//Initialisierung der Liste für alle Ländernamen
var alleLaenderNamen = [];

//Initialisierung der infoTafel = Kontrolelement
//Beim Auskommentieren nur noch die Basekarte sichtbar
var infoTafel = L.control();

//Bei hinzufügen von infoTafel => Erstellung eines div und info Elements
//info style -> in css definiert
infoTafel.onAdd = function(karte) {
  this._div = L.DomUtil.create('div', 'info');
  this.update();
  return this._div;
};

//Funktion setzeLandInAuswahlBox
var setzeLandInAuswahlBox = function() {
  var auswahlBox = document.getElementById('landAuswahl');
  if (auswahlBox) {
    for (var option, index = 0; option = auswahlBox.options[index]; index++) {
      if (option.value == gemerktesZuletztGewaehltesLand) {
        auswahlBox.selectedIndex = index;
        break;
      }
    }
  }
};

//Variable Initialisierung
var alterHtmlCode = '';

//Funktion landAuswahlBox
var landAuswahlBox = function() {
  var htmlCode = '<select id="landAuswahl" onchange="reagiereAufLandAuswahl()">';
  for (var index in alleLaenderNamen) {
    var bezeichner = alleLaenderNamen[index];
    if (bezeichner) {
      htmlCode += '<option>' + bezeichner + '</option>';
    }
  }
  htmlCode += '</select>';
  alterHtmlCode = htmlCode;
  return htmlCode;
};

//Funktion gewaehltesLand
//Gibt als String zurück, was man in der Box ausgewählt hat
var gewaehltesLand = function() {
  var auswahlBox = document.getElementById("landAuswahl");
  if (auswahlBox && auswahlBox.selectedIndex != -1) {
    var option = auswahlBox.options[auswahlBox.selectedIndex];
    if (option) {
      return option.text;
    } else {
      ''
    }
  } else {
    ''
  }
};

//Updatefunktion -> HTML Code für die Box
infoTafel.update = function() {
  // Box Hintergrund Größe ändern, äußerer div container
  var htmlCode = '<div style="width: 350px;height: 600px;"> <h4>Land ';
  htmlCode += landAuswahlBox();
  htmlCode += '<br>'
  htmlCode += '<input type="button" value="Tempo" id="tempo" onclick="reagiereAufWertebereichAuswahl(this.id)"> </input>';
  htmlCode += '<input type="button" value="Danceability" id="danceability" onclick="reagiereAufWertebereichAuswahl(this.id)"> </input>';
  htmlCode += '<input type="button" value="Energy" id="energy" onclick="reagiereAufWertebereichAuswahl(this.id)"> </input>';
  htmlCode += '<input type="button" value="Valence" id="valence" onclick="reagiereAufWertebereichAuswahl(this.id)"> </input>';
  htmlCode += '</h4>';
  htmlCode += '<div id="Diagramm"></div>'
  htmlCode += '</div>';
  this._div.innerHTML = htmlCode;
};


console.log(clicked_feature);

//Hinzufügen der Elemente [Box mit Diagramm] zur Karte
infoTafel.addTo(karte);

//Funktion hebeAuswahlHervor
//Zugriff auf JSON Attribute
function hebeAuswahlHervor(ereignis, landName, chartsDaten) {
  if (ereignis) {
    var ebene = ereignis.target;
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      ebene.bringToFront();
    }
  }
  infoTafel.update();
  gemerktesZuletztGewaehltesLand = landName;
  karte.removeLayer(geojsonEbene);
  initialisiereGeoJsonEbene();
  setzeLandInAuswahlBox();
  var einLandDaten = chartsDaten.filter(function(datenSatz) {
      return (datenSatz.Country == landName ||
        (
          datenSatz.Country == null &&
          landName == 'Global')) //&& datenSatz.name == 'Einwohner insgesamt'
      ;
    })
    .map(function(datenSatz) {
      return {
        "Chartposition": datenSatz.Chartposition,
        "tempo": datenSatz.tempo,
        "energy": datenSatz.energy,
        "danceability": datenSatz.danceability,
        "valence": datenSatz.valence
      };

    });

  erstelleDiagramm(einLandDaten);
}
//Ende Funktion hebeAuswahlHervor

//Funktion setzeAuswahlZurueck
function setzeAuswahlZurueck(ereignis) {
  infoTafel.update();
  gemerktesZuletztGewaehltesLand = 'alle';
  karte.removeLayer(geojsonEbene);
  initialisiereGeoJsonEbene();
  setzeLandInAuswahlBox();
}

//Wichtig: Funktion initialisiereGeoJsonEbene!
var initialisiereGeoJsonEbene = function() {

  $.getJSON("laender.json", function(data) {
    // Länder-Polygone setzen
    geojsonEbene = L.geoJson(data, {
      style: ebenenStil
    });
    karte.addLayer(geojsonEbene);

    //Funktion in Funktion: polygonMittelpunkt
    var polygonMittelpunkt = function(arr) {
      var arrToUse;
      if (arr.length == 1) {
        arrToUse = arr[0];
      } else {
        arrToUse = arr;
      }
      return arrToUse.reduce(function(x, y) {
        return [x[0] + y[0] / arrToUse.length, x[1] + y[1] / arrToUse.length]
      }, [0, 0])
    }; //Ende von Funktion polygonMittelpunkt

    //Import der JSON Datei
    $.getJSON("chart_infos.json",
      //Default Einstellung auf welche Daten aus der JSON zugegriffen wird

      //Funktion für Daten aus chartsDaten um die DropDownBox zu füllen
      function(chartsDaten) {
        if (alleLaenderNamen.length == 0) {
          alleLaenderNamen = [];
          //Datensatz filtern
          chartsDaten
            .filter(function(datenSatz) {
              return datenSatz.Chartposition == 1;
            })
            .forEach(function(datenSatz) {
              if (datenSatz.Country != null) {
                alleLaenderNamen.push(datenSatz.Country);
              }
            });
          //Füllen der Liste mit den Ländernamen
          alleLaenderNamen = alleLaenderNamen.sort();
          infoTafel.update();
          //Landauswahl
          gemerktesZuletztGewaehltesLand = 'Global';
          setzeLandInAuswahlBox();
        }
        //Verknüpfung mit laender.json
        //Ereignis -> hebeAuswahlHervor
        geojsonEbene.on('click', function(ereignis) {
          if (karte) {
            var eigenschaften = ereignis.layer.feature.properties
            var landName = eigenschaften.name
            if (gemerktesZuletztGewaehltesLand == landName) {
              hebeAuswahlHervor(ereignis, 'Global', chartsDaten);
            } else {
              hebeAuswahlHervor(ereignis, landName, chartsDaten);
            }
          }
        });
        if (auswahlAenderung) {
          hebeAuswahlHervor(undefined, gemerktesZuletztGewaehltesLand, chartsDaten);
          auswahlAenderung = false;
        }
      }) //Ende von getJSON einwohner
    ;
  }) //Ende von getJSON laender
  ;
}; //Ende Funktion initialisiereGeoJsonEbene

//erster Funktionsaufruf von initialisiereGeoJsonEbene() -> Initialisierung
//wird in diversen Funktionen zum updaten verwendet
initialisiereGeoJsonEbene();


//Funktion erstelleDiagramm
//Funktionsaufruf erfolgt in hebeAuswahlHervor
//einLandDaten == gefilterte chartsDaten aus charts_infos.json
var erstelleDiagramm = function(einLandDaten) {

  //Erstellung und Zuweisung diversen Variablen für das Diagramm
  var abstaende = {
    links: 30,
    oben: 30,
    rechts: 30,
    unten: 70
  };
  var breite = 350 - abstaende.links - abstaende.rechts;
  var hoehe = 550 - abstaende.oben - abstaende.unten;

  var feature = clicked_feature;

  var format = d3.format(".2f");

  var xMin = d3.min(einLandDaten, function(d) {
    return d[feature]
  });

  var xMax = d3.max(einLandDaten, function(d) {
    return d[feature]
  });

  var xAvg = d3.mean(einLandDaten, function(d) {
    return d[feature];
  });

  //Skallierung der X Achse:
  //Für alle Features die eine [0,1] haben = 1;
  //Tempo ist aktuell einziges Feature mit anderer Skala => passender Wert: 200 zugewiesen
  if (xMax < 1) {
    xAchseMax = 1
  } else {
    xAchseMax = 200
  };

  //Allgemeines svg Objekt für das Diagramm zur Einbettung in div erstellen
  var svg = d3.select("#Diagramm")
    .append("svg")
    .attr("width", breite + abstaende.links + abstaende.rechts)
    .attr("height", hoehe + abstaende.oben + abstaende.unten)
    .append("g")
    .attr("transform", "translate(" + abstaende.links + "," + abstaende.oben + ")");

  // X Achse initialisieren
  var x = d3.scaleLinear()
    .domain([0, 1])
    .range([0, breite]);
  var xAchse = svg.append("g")
    .attr("transform", "translate(0," + hoehe + ")")
    .call(d3.axisBottom(x))

  // Y Achse initialisieren
  var y = d3.scaleBand()
    .range([0, hoehe])
    .domain(einLandDaten.map(function(d) {
      return d.Chartposition;
    }))
    .padding(.1);
  var yAchse = svg.append("g")
    .call(d3.axisLeft(y))


  //X Achse updaten
  x.domain([0, xAchseMax]);
  xAchse.call(d3.axisBottom(x))

  // the Y Achse updaten
  y.domain(einLandDaten.map(function(d) {
    return d.Chartposition;
  }))
  yAchse.transition().duration(1000).call(d3.axisLeft(y));

  // u variable erstellen / initialisieren
  var u = svg.selectAll("rect")
    .data(einLandDaten)

  u
    .enter()
    .append("rect")
    .merge(u)
    .transition()
    .duration(1000)
    .attr("x", function(d) {
      return x(0);
    })
    .attr("y", function(d) {
      return y(d.Chartposition);
    })

    .attr("width", function(d) {
      return x(d[feature]);
    })
    .attr("height", y.bandwidth())
    .attr("fill", "#1DB954");

  var linie = svg.append("line")
    .attr("x1", breite / 2)
    .attr("x2", breite / 2)
    .attr("y1", 0)
    .attr("y2", hoehe)
    .style("stroke", "black")
    .style("stroke-width", 4);

  var text = svg.append("text")
    .text(function(d) {
      return "Durchschnitt:  " + format(xAvg);
    })
    .attr("x", 0)
    .attr("y", hoehe + abstaende.oben / 2 + abstaende.unten / 2);


  u
    .exit()
    .remove()
};
//Ende Funktion erstelleDiagramm

var waehleFeature = function(clicked_id) {
  clicked_feature = clicked_id;
};