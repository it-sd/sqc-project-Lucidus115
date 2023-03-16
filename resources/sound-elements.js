/// This file provides the schematics for what every element looks like in
/// the sound editor

// Keep count of sound nodes and append to keep sound sample id unique
let soundCount = 0

const Schematic = {
  layer: function (layerData) {
    const div = document.createElement('div')
    div.id = `layer-${layerData.id}`
    div.className = 'layer-group'

    const layer = document.createElement('div')
    layer.className = 'tl-layer'
    layer.style.backgroundColor = layerData.color

    const span = document.createElement('span')
    span.appendChild(document.createTextNode(layerData.name))
    layer.appendChild(span)

    const samples = document.createElement('div')
    samples.className = 'tl-samples'

    samples.addEventListener('dragover', (e) => {
      // Allow drop
      e.preventDefault()
    },
    false)
    
    samples.addEventListener('drop', (e) => {
      samples.classList.remove('dragover')
    
      if (!dragged.classList.contains('sound-sample')) {
        return
      }
    
      const layerId = samples.parentElement.id.split('-')[1]
      div.dispatchEvent(new CustomEvent('sampleAdd', { detail: { layerId: layerId } }))
    })
    
    /** Visual indicators for if an item is droppable onto the target */
    samples.addEventListener('dragenter', (e) => {
      samples.classList.add('dragover')
    })
    samples.addEventListener('dragleave', (e) => {
      samples.classList.remove('dragover')
    })

    div.addEventListener('sampleAdd', async (e) => {
      const url = new URL('/sound-editor/timeline/addSample', baseUrl)
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ 
          layerId: e.detail.layerId,
          sampleId: dragged.id
        }),
        headers: { 'Content-Type': 'application/json' }
      })
    
      const result = await res.json()
      console.log(result.success)
    
      //TODO: Only append if result is valid position
      const node = dragged.cloneNode(true)
      node.style.borderColor = div.querySelector('div.tl-layer').style.backgroundColor
      e.target.querySelector('div.tl-samples').appendChild(node)
    })

    div.appendChild(layer)
    div.appendChild(samples)

    return div
  },

  soundSample: function (soundData) {
    const div = document.createElement('div')
    div.id = `sound-${soundData.id}-${soundCount++}`
    div.className = 'sound-sample'
    div.draggable = true

    const title = document.createElement('span')
    title.appendChild(document.createTextNode(soundData.name))
    
    div.appendChild(title)
    div.title = title.textContent

    return div
  }
}