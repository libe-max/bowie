import React, { Component } from 'react'
import YouTube from 'react-youtube'
import DatePicker from 'react-date-picker'
import moment from 'moment'
import 'moment/locale/fr'

import SectionTitle from 'libe-components/lib/text-levels/SectionTitle'
import Paragraph from 'libe-components/lib/text-levels/Paragraph'
import squareImg from './assets/square.jpg'
import closeIcon from './assets/close-icon.svg'

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
      active_single_id: null,
      selected_date: null
    }
    this.fetchData = this.fetchData.bind(this)
    this.leaveIntro = this.leaveIntro.bind(this)
    this.stretchCoverPanels = this.stretchCoverPanels.bind(this)
    this.scrollToAndActivateDate = this.scrollToAndActivateDate.bind(this)
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
    if (state.active_single_id !== null) classes.push(`${c}_with-player`)

    /* [WIP] render an empty page if data is loading */
    if (state.loading || !state.data) return <div className={classes.join(' ')} />

    /* Display page */
    return <div className={classes.join(' ')}>
      <div className={`${c}__cover-panel-wrapper`}>
        <div className={`${c}__cover-panel`}
          style={{backgroundImage: `url(http://www.fubiz.net/wp-content/uploads/2017/08/davidbowie19670.jpg)`}}>
          <div className={`${c}__page-title`}>
            <SectionTitle huge level={1}>
              Sous quel Bowie<br />suis-je né ?
            </SectionTitle>
          </div>
          <div className={`${c}__date-picker-block`}>
            <span className={`${c}__date-picker`}>
              <DatePicker value={state.selected_date ? new Date(state.selected_date) : null}
                onChange={val => this.scrollToAndActivateDate(val.valueOf())} />
            </span>
            <button className={`${c}__random-date`}
              onClick={this.leaveIntro}>
              Random
            </button>
          </div>
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
                  return inPeriod.map((single, j) => {
                    const classes = [`${c}__item`]
                    if (single.id === state.active_single_id) classes.push(`${c}__item_active`)
                    return <div key={j}
                      className={classes.join(' ')}
                      data-single-id={single.id}
                      data-single-timestamp={single.date.valueOf()}
                      onClick={e => this.setState({ active_single_id: single.id })}>
                      <div className={`${c}__item-photo`}
                        style={{backgroundImage: `url(${single.single_image})`}}>
                        <img alt='Technical helper for square div' src={squareImg} />
                      </div>
                      <div className={`${c}__item-name`}><Paragraph>{single.single_name}</Paragraph></div>
                      <div className={`${c}__item-label`}><Paragraph>{single.display_date}</Paragraph></div>
                    </div>
                  })
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
        <div className={`${c}__player-panel-spacer`} />
      </div>
      <div className={`${c}__player-panel`}>
        <div className={`${c}__player`}>{
          (() => {
            const id = state.active_single_id
            if (id === null) return ''
            const activeSingle = singles.filter(s => s.id === id)[0]
            const { single_url: singleUrl } = activeSingle
            const videoId = singleUrl.replace('https://youtu.be/', '')
            return <YouTube videoId={videoId} />
          })()
        }</div>
        <button className={`${c}__player-panel-close`}
          onClick={e => this.setState({ active_single_id: null })}>
          <img src={closeIcon} />
        </button>
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
          id: 'number',
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
    const res = {
      singles: data[0],
      periods: data[1],
      notes: data[2]
    }
    this.setState({
      loading: false,
      error: null,
      error_status: null,
      data: res
    })
    return res
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

  scrollToAndActivateDate (val) {
    const { state, c } = this
    const { data } = state
    const singles = data ? data.singles : []
    const anteriorSingles = singles.filter(s => s.date.valueOf() <= val)
      .sort((s1, s2) => s1.date.valueOf() < s2.date.valueOf())
    if (!anteriorSingles.length) {
      document.querySelector(`.${c}__chapter:first-child`)
        .scrollIntoView({
          block: 'start',
          behavior: 'smooth',
          inline: 'start'
        })
      return this.setState({
        selected_date: val,
        active_single_id: null
      })
    }
    const latestSingle = anteriorSingles[anteriorSingles.length - 1]
    const { id: latestSingleId } = latestSingle
    const $latestSingle = document.querySelector(`.${c}__item[data-single-id="${latestSingleId}"]`)
    $latestSingle.querySelector(`.${c}__item-label`).scrollIntoView({
      block: 'start',
      behavior: 'smooth',
      inline: 'start'
    })
    return setTimeout(() => this.setState({
      selected_date: val,
      active_single_id: latestSingleId
    }), 1000)
  }
}
