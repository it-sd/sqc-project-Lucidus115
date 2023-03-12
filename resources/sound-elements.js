/// This file provides the schematics for what every element looks like in
/// the sound editor

const spawnLayer = function (layerData) {
  const div = document.createElement('div')
  div.id = `layer-${layerData.id}`
  div.className = 'tl-layer'
  div.style.backgroundColor = layerData.color

  const span = document.createElement('span')
  span.appendChild(document.createTextNode(layerData.name))

  div.appendChild(span)

  return div
}