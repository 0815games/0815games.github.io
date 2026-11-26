// Item artwork in the reference style of assets/armory-kit.jpg — shared by the
// dossier inventory board and the armoury workshop cards. Keys without an
// image simply render the text variant.
export const ITEM_ART={
 'legacy-1':'assets/equip-scope.jpg?v=20261121-pwa1',
 'legacy-2':'assets/equip-vest.jpg?v=20261121-pwa1',
 'legacy-3':'assets/equip-boots.jpg?v=20261121-pwa1',
 'legacy-4':'assets/equip-binoculars.jpg?v=20261121-pwa1',
 'legacy-5':'assets/equip-fieldradio.jpg?v=20261121-pwa1',
 'legacy-6':'assets/equip-satchel.jpg?v=20261121-pwa1',
 'legacy-7':'assets/equip-pouch.jpg?v=20261121-pwa1',
 'legacy-8':'assets/equip-manual.jpg?v=20261121-pwa1',
 'legacy-9':'assets/equip-badge.jpg?v=20261121-pwa1',
 'legacy-10':'assets/equip-tankkit.jpg?v=20261121-pwa1',
 marksman:'assets/equip-marksman.jpg?v=20261121-pwa1',
 mechanic:'assets/equip-mechanic.jpg?v=20261121-pwa1',
 radio:'assets/equip-tacticalradio.jpg?v=20261121-pwa1',
 boots:'assets/equip-fieldboots.jpg?v=20261121-pwa1',
 'prestige-relay':'assets/prestige-relay.jpg?v=20261121-pwa1',
 'prestige-oscillator':'assets/prestige-oscillator.jpg?v=20261121-pwa1',
 'prestige-chargekey':'assets/prestige-chargekey.jpg?v=20261121-pwa1',
 'prestige-convoy-plate':'assets/prestige-convoy-plate.jpg?v=20261121-pwa1',
 'prestige-tidelock-seal':'assets/prestige-tidelock-seal.jpg?v=20261121-pwa1',
 'prestige-bridge-marker':'assets/prestige-bridge-marker.jpg?v=20261121-pwa1',
 'prestige-receiver':'assets/prestige-receiver.jpg?v=20261121-pwa1',
 'prestige-icekey':'assets/prestige-icekey.jpg?v=20261121-pwa1',
 'prestige-transformer-coil':'assets/prestige-transformer-coil.jpg?v=20261121-pwa1',
 'prestige-nia-badge':'assets/prestige-nia-badge.jpg?v=20261121-pwa1',
 'prestige-broadcast-horn':'assets/prestige-broadcast-horn.jpg?v=20261121-pwa1',
 'prestige-override-flag':'assets/prestige-override-flag.jpg?v=20261121-pwa1',
};
export const artOf=id=>ITEM_ART[id]||'';
