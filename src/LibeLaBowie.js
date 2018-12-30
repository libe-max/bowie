import React, { Component } from 'react'
import moment from 'moment'
import 'moment/locale/fr'

import PageTitle from 'libe-components/lib/text-levels/PageTitle'
import Hat from 'libe-components/lib/text-levels/Hat'
import SectionTitle from 'libe-components/lib/text-levels/SectionTitle'
import Paragraph from 'libe-components/lib/text-levels/Paragraph'
import AnnotationTitle from 'libe-components/lib/text-levels/AnnotationTitle'
import Annotation from 'libe-components/lib/text-levels/Annotation'
import squareImg from './assets/square.jpg'

import { parseTsvWithTabs } from 'libe-utils/parse-tsv'
import { spreadsheet } from './config.json'
/* Remove this once this app styles are pasted into
 * liberation.fr/apps/static/styles/apps.css */
import './app.css'


export default class LibeLaBowie extends Component {
  constructor () {
    super()
    this.c = 'libe-labowie'
    this.state = {
      loading: true,
      error: null,
      error_status: null,
      data: null,
      intro_page: false,
      active_single: null
    }
    this.fetchData = this.fetchData.bind(this)
    this.leaveIntro = this.leaveIntro.bind(this)
    this.stretchCoverPanels = this.stretchCoverPanels.bind(this)
    this.fetchData()
    window.setInterval(() => this.stretchCoverPanels(), 200)
  }

  componentWillUnmount () {
    window.clearInterval(() => this.stretchCoverPanels(), 200)
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

    /* [WIP] render an empty page if data is loading */
    if (state.loading || !state.data) return <div className={classes.join(' ')} />

    /* Display page */
    return <div className={classes.join(' ')}>
      <div className={`${c}__cover-panel-wrapper`}>
        <div className={`${c}__cover-panel`}>
          <button onClick={this.leaveIntro}>Go !</button>
        </div>
      </div>
      <div className={`${c}__content-panel`}>
        <div className={`${c}__intro`}>
          Il faut une intro ici, non ?
        </div>
        <div className={`${c}__chapters`}>{
          periods.map((period, i) => (
            <section className={`${c}__chapter`} key={i}>
              <div className={`${c}__chapter-name`}>
                <div className={`${c}__chapter-name-desktop`}><SectionTitle level={2}>{period.period}</SectionTitle></div>
                <div className={`${c}__chapter-name-mobile`}><SectionTitle level={2}>{period.period}</SectionTitle></div>
              </div>
              <div className={`${c}__chapter-content`}><Paragraph>{period.text}</Paragraph></div>
              <div className={`${c}__items`}>
                <div className={`${c}__item-left-spacer`} />
                {(() => {
                  const { start_date: start, end_date: end } = period
                  const inPeriod = singles.filter(s => (
                    s.date.valueOf() >= start.valueOf() &&
                    s.date.valueOf() <= end.valueOf()
                  ))
                  inPeriod.forEach(single => console.log(single))
                  return inPeriod.map((single, j) => (
                    <div className={`${c}__item`} key={j}>
                      <div className={`${c}__item-photo`}
                        onClick={() => {console.log(single)}}
                        style={{backgroundImage: `url(${single.single_image})`}}>
                        <img src={squareImg} />
                      </div>
                      <div className={`${c}__item-name`}><Paragraph>{single.single_name}</Paragraph></div>
                      <div className={`${c}__item-label`}><Paragraph>{single.display_date}</Paragraph></div>
                    </div>
                  ))
                })()}
                <div className={`${c}__item-right-spacer`} />
              </div>
            </section>
          ))
        }</div>
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
        end: 7,
        keysLinePos: 1,
        types: {
          date: val => moment(val, 'DD/MM/YYYY'),
          display_date: val => val.split('/').length === 2
            ? moment(val, 'MM/YYYY').format('MMMM YYYY')
            : moment(val, 'DD/MM/YYYY').format('Do MMMM YYYY'),
        }
      }, {
        start: 8,
        end: 12,
        keysLinePos: 1,
        types: {
          start_date: val => moment(val, 'DD/MM/YYYY'),
          end_date: val => moment(val, 'DD/MM/YYYY'),
        }
      }, {
        start: 13,
        end: 13,
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

  stretchCoverPanels () {
    const { state, c } =  this
    if (state.loading || !state.data) return
    const bodyPadding = document.querySelector('body').style.paddingTop
    document.querySelector(`.${c}__cover-panel-wrapper`).style.height = `calc(100vh - ${bodyPadding})`
    document.querySelector(`.${c}__cover-panel`).style.height = `calc(100vh - ${bodyPadding})`
    document.querySelectorAll(`.${c}__chapter-name-mobile`).forEach(elt => elt.style.height = `calc(100vh - ${bodyPadding})`)
  }
}