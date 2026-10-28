"use strict";
const assert=require("node:assert/strict");
const {canDock}=require("../src/command-deck.js");
const cases=[
 [1440,780,80,true],[1200,600,80,true],[1000,400,80,true],
 [999,780,80,false],[390,700,80,false],[844,330,70,false],
 [1440,350,80,false],[1000,399,80,false],[1000,450,130,true],
 [1000,449,130,false],[NaN,700,80,false],[1200,NaN,80,false],
 [1200,700,NaN,false]
];
for(const [w,h,d,want] of cases)assert.equal(canDock(w,h,d),want,JSON.stringify({w,h,d}));
console.log("Baumenü: "+cases.length+" Platzprüfungen bestanden.");
