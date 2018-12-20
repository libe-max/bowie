import React from 'react'
import ReactDOM from 'react-dom'
import LibeLaBowie from './LibeLaBowie'
import * as serviceWorker from './serviceWorker'
import config from './config.json'

ReactDOM.render(
  <LibeLaBowie {...config} />,
  document.getElementById('libe-labo-app-wrapper')
)

serviceWorker.unregister()
