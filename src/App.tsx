import React, { ReactNode, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import BoxParser from './parser';
import { Logger } from './utils/Logger';
import { Box } from './parser/Box';

const sourceFile = 'https://demo.castlabs.com/tmp/text0.mp4'

type Base64Image = {
  element: ReactNode
}

function App() {
  const [parsedImages, setParsedImages] = useState<Base64Image[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [error, setError] = useState<string | null>(null)

  const startAnalyzing = () => {
    const req = new XMLHttpRequest();
    req.open('GET', sourceFile, true);
    req.responseType = "arraybuffer";

    req.onload = handleSourceLoad.bind(null, req)

    req.send(null);
  }

  const handleSourceLoad = (req: XMLHttpRequest, event: any) => {
    const { response } = req;

    const arrayBuffer = response as ArrayBuffer

    if (arrayBuffer == null) {
      return
    }

    processLoadedFile(arrayBuffer)
  }

  const processLoadedFile = (arrayBuffer: ArrayBuffer) => {
    const boxParser = new BoxParser(Logger.log)

    try {
      boxParser
        .setRawData(new Uint8Array(arrayBuffer))
        .setConsoleLog(true)
        .readData()
    } catch (error: any) {
      setError("BoxParser could not parse the file for some reason")
      return
    }

    const { xmlContent = '', boxes = [] } = boxParser.getReporting() as any

    setError(null)
    setBoxes(boxes)
    setParsedImages(parseImages(xmlContent))
  }

  const parseImages = (xmlContent: string): Base64Image[] => {
    const domParser = new DOMParser();
    const xmlDocument = domParser.parseFromString(xmlContent, 'text/xml')

    const errorNode = xmlDocument.querySelector("parsererror");
    if (errorNode) {
      setError("Could not read images from the XML document");
      return []
    }

    const imageList = xmlDocument.getElementsByTagName('smpte:image')
    let images: Base64Image[] = []

    for (let index = 0; index < imageList.length; index++) {
      const element = imageList[index];
      const base64Value = element.childNodes[0].nodeValue

      if (!base64Value) {
        continue
      }

      images.push({
        element: <img key={index} src={`data:image/png;base64, ${base64Value.trim()}`} alt="" width={160} height={90} />
      })
    }

    return images
  }

  const getImageSection = () =>
    parsedImages.length > 0 && <>
      <p><b>Images</b></p>
      <div className='App-image-container'>
        {parsedImages.map((e, index) =>
          <div key={index} className='App-image-box'>
            {e.element}
          </div>)}
      </div>
    </>

  const getBoxSection = () => boxes.length > 0 && <>
    <p><b>Boxes</b></p>
    <div className='App-box-container-wrap'>
      {boxes.map((box, index) =>
        <>
          {renderBoxRow(box)}
        </>
      )}
    </div>
  </>

  const renderBoxRow = (box: Box, parentBox?: Box) => {
    if (box == null) {
      return
    }

    const type = box.type?.toString()
    const BoxItself = <div key={type} className='App-image-box App-box-content'>
      <p>Box type : {type}</p>
      <p>Box size : {box.size}</p>
      {parentBox ? <p>Parent Box type : {parentBox.type?.toString()}</p> : <></>}
    </div>

    if (box.childBoxes.length === 0) {
      return <div className='App-box-container'>
        {BoxItself}
      </div>
    }

    let boxes = []

    for (let index = 0; index < box.childBoxes.length; index++) {
      boxes.push(renderBoxRow(box.childBoxes[index], box))
    }

    return <div className='App-box-container-wrap'>
      {BoxItself}
      <div className='App-box-container-wrap-child'>
        {boxes}
      </div>
    </div>
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
      </header>

      <section className='App-detail'>
        <p>
          Please click to below button to analyze the file. You can track all steps in the browser console and here.
        </p>
        <button
          onClick={() => startAnalyzing()}
          className="App-button"
        >
          Analyze
        </button>

        {error && <p>{error}</p>}
      </section>

      <section className='App-result'>
        <>
          {getImageSection()}
          {getBoxSection()}
        </>
      </section>
    </div>
  );
}

export default App;
