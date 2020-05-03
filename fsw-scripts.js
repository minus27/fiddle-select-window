// ==UserScript==
// @name         Fiddle Select Window 1
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Present a window with a the fiddles known to the browser for a user to select from
// @author       Stephen Kiel
// @match        https://fiddle.fastlydemo.net/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log("Select a Fiddle code inserted");

    function hideModal() { document.querySelector(".fsw-outer-container").style.display = "none"; }

    function adjustContentHeight() {
        function getCompStyle(e,s) { return parseInt(getComputedStyle(e)[s]); }
        let fsw_inner_container = document.querySelector(".fsw-inner-container"),
            fsw_content_container = document.querySelector(".fsw-content-container"),
            maxHeight = fsw_inner_container.offsetHeight;
        maxHeight -= (getCompStyle(fsw_content_container,'paddingTop') + getCompStyle(fsw_content_container,'paddingBottom'));
        maxHeight -= (getCompStyle(fsw_inner_container,'paddingTop') + getCompStyle(fsw_inner_container,'paddingBottom'));
        maxHeight -= (getCompStyle(fsw_inner_container,'borderTop') + getCompStyle(fsw_inner_container,'borderBottom'));
        maxHeight -= document.querySelector(".fsw-title").offsetHeight;
        document.querySelector(".fsw-content").style.maxHeight = `${maxHeight}px`;
    }

    function showModal() {
        document.querySelector(".fsw-outer-container").style.display = "block";
        adjustContentHeight();
        sortFiddleList('.fsw-content',['className','innerText']);
    }

    function setOnclick(sel,func) {
        let nodeList = document.querySelectorAll(sel);
        if (nodeList.length == 0) {
            console.error(`Node not found for selector "${sel}"`);
        } if (nodeList.length > 1) {
            console.error(`Multiple nodes found for selector "${sel}"`);
        } else {
            nodeList[0].onclick = func;
        }
    }

    function sortFiddleList(listSelector = null, attrList = 'innerText') {
      const attrName = 'presort-id',
            valDelim = '\t';
      if (!Array.isArray(attrList)) attrList = [ attrList ];
      if (listSelector == null) { console.error('Selector not specified'); return; }
      let nodeList = document.querySelectorAll(`${listSelector}`);
      if (nodeList.length == 0) { console.error(`List not found`); return; }
      if (nodeList.length > 1) { console.error(`Multiple lists found`); return; }
      nodeList = document.querySelectorAll(`${listSelector} > li`);
      if (nodeList.length == 0) { console.error(`No list items found`); return; }
      let itemSortVals = [];
      nodeList.forEach((node,nodeIndex) => {
        node.setAttribute(`${attrName}`,nodeIndex);
        let itemSortVal = [];
        attrList.forEach((attr, attrIndex) => {
          try {
            itemSortVal.push( (attr in node) ? String(node[attr]) : '' );
          } catch(e) {
            console.error(`Issues getting attribute "${attr}" from list item ${attrIndex}`); return;
          }
        });
        itemSortVal.push( nodeIndex );
        itemSortVals.push( itemSortVal.join( valDelim ) );
      });
      itemSortVals.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
      itemSortVals.forEach( (itemSortVal) => {
        let attrVal = itemSortVal.split(valDelim).pop();
        document.querySelector(listSelector).appendChild(document.querySelector(`${listSelector} [${attrName}="${attrVal}"]`));
      });
    }

    // Check if there is any fiddle data in localStorage to display
    if (!('fiddles' in localStorage)) {
        console.info('No fiddle data');
        return;
    }
    try {
        var fiddleData = JSON.parse(localStorage.fiddles);
    } catch(e) {
        console.error('Bad fiddle data');
        return;
    }
    if (Object.keys(fiddleData).length == 0) {
        console.info('Fiddle data is empty');
        return;
    }

    // Add the necessary styles to the document for the Fiddle Select Window
    var styleTag = document.createElement('style');
    styleTag.type = "text/css";
    styleTag.innerHTML = [
        `.fsw-outer-container { display: none; position: fixed; z-index: 1; padding-top: 100px; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgb(0,0,0); background-color: rgba(0,0,0,0.4); }`,
        `.fsw-inner-container { background-color: #ffffff; margin: auto; padding: 0em; max-width: 50%; max-height: 30%; min-height: 30%; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: left; }`,
        `.fsw-inner-container { border: 2px solid #e82c2a; border-radius: 6px; }`,
        `.fsw-title { font-family: system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Helvetica,Arial,sans-serif; }`,
        `.fsw-title { font-weight: bold; text-align: center; padding: 0.5em; background-color: #e82c2a; color: #ffffff; }`,
        `.fsw-close { display: inline-block; float:right; font-weight: bold; cursor: pointer; }`,
        `.fsw-content-container { padding: 0.5em 0em; }`,
        `.fsw-content { overflow-x: hidden; overflow-x: auto; margin-top: 0; margin-bottom: 0; padding-right: 1em; }`,
    ].join('\n');
    document.head.appendChild(styleTag);

    // Create and prepare the elements for the Fiddle Select Window
    var outerDiv = document.createElement('div'),
        innerDiv = document.createElement('div'),
        titleDiv = document.createElement('div'),
        contentDiv = document.createElement('div'),
        xSpan = document.createElement('span'),
        list = document.createElement('ol');
    outerDiv.className = "fsw-outer-container";
    innerDiv.className = "fsw-inner-container";
    titleDiv.className = "fsw-title";
    contentDiv.className = "fsw-content-container";
    xSpan.className = "fsw-close";
    list.className = "fsw-content";
    titleDiv.innerText = "Select One of Your Locked Fiddles";
    xSpan.innerHTML = "&#10005;"; // Square X for to use as close button
    document.querySelector("body").appendChild(outerDiv);
    outerDiv.appendChild(innerDiv);
    innerDiv.appendChild(titleDiv);
    titleDiv.appendChild(xSpan);
    innerDiv.appendChild(contentDiv);
    contentDiv.appendChild(list);

    // Create the fiddle items in the Fiddle Select Window
    Object.keys(fiddleData).sort().forEach(key => {
        let li = document.createElement('li'),
            a = document.createElement('a');
        a.className = `fid${key}`;
        a.href = `https://fiddle.fastlydemo.net/fiddle/${key}`;
        // Use the fiddle ID as the default name of each fiddle item
        a.innerText = key;
        list.appendChild(li);
        li.appendChild(a);
        // Replace the name of each fiddle item with the fiddle's actual title if it has one
        fetch(`https://fiddle.fastlydemo.net/fiddle/${key}`,{headers:{accept:'application/json'}})
            .then(response => response.json())
            .then(data => { if (data.fiddle.title != '') document.querySelector(`.fid${key}`).innerText = data.fiddle.title; } );
    });

    // Click any open space in the header to open the Fiddle Select Window
    ['header','.fiddle-title','.container.container--header'].forEach( selector => {
        setOnclick(selector, function(clickedElement) {
            if(this === (window.event || clickedElement).target) { showModal(); }
        });
    } );

    // Click on the X in title of the Fiddle Select Window or anywhere outside of the window to close it
    setOnclick('.fsw-close', function() { hideModal(); });
    window.onclick = function(e) { if (e.target.className == "fsw-outer-container") { hideModal(); } };

    // Adjust the content height of the Fiddle Select Window whe the window resizes
    window.onresize = function() {
        if (document.querySelector(".fsw-outer-container").style.display == "block") adjustContentHeight();
    }
})();
