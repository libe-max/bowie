import React from 'react'
import ReactDOM from 'react-dom'
import PageTitle from 'libe-components/lib/text-levels/PageTitle'
import parseTsv from 'libe-utils/parse-tsv'
import * as serviceWorker from './serviceWorker'
import config from './config.json'

const App = props => <div>
  <PageTitle>Titre</PageTitle>
  {/* Replace this App component with your app */}
</div>

ReactDOM.render(
  <App {...config} />,
  document.getElementById('libe-labo-app-wrapper')
)

serviceWorker.unregister()
