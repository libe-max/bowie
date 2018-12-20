import React, { Component } from 'react'
import moment from 'moment'
import 'moment/locale/fr'

import PageTitle from 'libe-components/lib/text-levels/PageTitle'
import Paragraph from 'libe-components/lib/text-levels/Paragraph'

import { parseTsvWithTabs } from 'libe-utils/parse-tsv'
import { spreadsheet } from './config.json'
/* Remove this once this app styles are pasted into
 * liberation.fr/apps/static/styles/apps.css */
import './app.css'


export default class LibeLaBowie extends Component {
  c = 'libe-labowie'

  state = {
    loading: true,
    error: null,
    error_status: null,
    data: null,
    intro_page: true,
    active_single: null
  }

  constructor () {
    super()
    this.fetchData = this.fetchData.bind(this)
    this.leaveIntro = this.leaveIntro.bind(this)
    this.stretchCoverPanel = this.stretchCoverPanel.bind(this)
    this.fetchData()
  }

  render () {
    const { state, c } = this
    const { data } = state
    const singles = data ? data.singles : []
    const periods = data ? data.periods : []
    const notes = data ? data.notes : []

    /* Conditional css classes */
    const classes = [c]
    if (state.error) classes.push(`${c}_error`)
    if (state.intro_page) classes.push(`${c}_intro`)
    if (state.active_single) classes.push(`${c}_player`)

    if (state.loading || !state.data) return <div className={classes.join(' ')} />
    return <div className={classes.join(' ')}>
      <div className={`${c}__cover-panel-wrapper`}>
        <div className={`${c}__cover-panel`}>
          <button onClick={this.leaveIntro}>Go !</button>
        </div>
      </div>
      <div className={`${c}__singles-panel`}>
        <div className={`${c}__before-bowie`}>
          <Paragraph>{periods[0].text}</Paragraph>
        </div>
        <div className={`${c}__singles`}>Singles !</div>
        <div className={`${c}__notes`}>Notes</div>
        <div className={`${c}__credits`}>Credits</div>
        <div className={`${c}__share`}>Share</div>
        <div className={`${c}__lblb-logo`}>Logo !</div>
      </div>
    </div>
  }

  async fetchData () {
    const response = await fetch(spreadsheet)
    if (!response.ok) return this.setState({
      loading: false,
      error: true,
      error_status: response.status
    })
    const strData = await response.text()
    const data = parseTsvWithTabs({
      tsv: strData,
      tabsParams: [{
        start: 0,
        end: 6,
        keysLinePos: 1,
        types: {
          date: val => moment(val, 'DD/MM/YYYY'),
          display_date: val => val.split('/').length === 2
            ? moment(val, 'MM/YYYY').format('MMMM YYYY')
            : moment(val, 'DD/MM/YYYY').format('Do MMMM YYYY'),
        }
      }, {
        start: 7,
        end: 11,
        keysLinePos: 1,
        types: {
          start_date: val => moment(val, 'DD/MM/YYYY'),
          end_date: val => moment(val, 'DD/MM/YYYY'),
        }
      }, {
        start: 12,
        end: 12,
        keysLinePos: 1
      }]
    })
    return this.setState({
      loading: false,
      error: null,
      error_status: null,
      data: {
        singles: data[0],
        periods: data[1],
        notes: data[2]
      }
    })
  }

  leaveIntro () {
    const { state } = this
    if (state.intro_page) {
      this.setState({ intro_page: false })
    }
  }

  stretcher = window.setInterval(() => this.stretchCoverPanel(), 200)

  componentWillUnmount () {
    window.clearInterval(this.stretcher)
  }

  stretchCoverPanel () {
    if (this.state.loading || !this.state.data) return
    const bodyPadding = document.querySelector('body').style.paddingTop
    document.querySelector('.libe-labowie__cover-panel').style.height = `calc(100vh - ${bodyPadding})`
  }
}
