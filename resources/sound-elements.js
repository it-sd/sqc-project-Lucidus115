/// This file provides the schematics for what every element looks like in
/// the sound editor

const Schematic = {
  layer: function (layerData) {
    const div = document.createElement('div')
    div.id = `layer-${layerData.id}`
    div.className = 'tl-layer'
    div.style.backgroundColor = layerData.color

    const span = document.createElement('span')
    span.appendChild(document.createTextNode(layerData.name))

    div.appendChild(span)

    return div
  },

  soundSample: function (soundData) {
    const div = document.createElement('div')
    div.id = `sound-${soundData.id}`
    div.className = 'sound-sample'

    const title = document.createElement('span')
    title.appendChild(document.createTextNode(soundData.name))
    
    div.appendChild(title)
    div.title = title.textContent

    return div
  }
}