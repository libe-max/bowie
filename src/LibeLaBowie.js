import React, { Component } from 'react'
import { Parser } from 'html-to-react'
import YouTube from 'react-youtube'
import moment from 'moment'
import 'moment/locale/fr'

import SectionTitle from 'libe-components/lib/text-levels/SectionTitle'
import Paragraph from 'libe-components/lib/text-levels/Paragraph'
import squareImg from './assets/square.jpg'
import closeIcon from './assets/close-icon.svg'
import randomIcon from './assets/random-icon.svg'

import { parseTsvWithTabs } from 'libe-utils/parse-tsv'
import { spreadsheet } from './config.json'
/* Remove this once this app styles are pasted into
 * liberation.fr/apps/static/styles/apps.css */
import './app.css'

import smoothscroll from 'smoothscroll-polyfill'
smoothscroll.polyfill()

export default class LibeLaBowie extends Component {
  constructor () {
    super()
    this.c = 'libe-labowie'
    this.state = {
      loading: true,
      error: null,
      error_status: null,
      data: null,
      intro_page: true,
      active_single_id: null,
      selected_date: null,
      active_label: 0,
      hide_label: false
    }
    this.fetchData = this.fetchData.bind(this)
    this.h2r = new Parser()
    this.leaveIntro = this.leaveIntro.bind(this)
    this.handleDateChange = this.handleDateChange.bind(this)
    this.handleRandomButtonClick = this.handleRandomButtonClick.bind(this)
    this.stretchCoverPanels = this.stretchCoverPanels.bind(this)
    this.replaceInstruction = this.replaceInstruction.bind(this)
    this.scrollToAndActivateDate = this.scrollToAndActivateDate.bind(this)
    this.$getClosestParent = this.$getClosestParent.bind(this)
    this.fetchData()
    window.setTimeout(() => this.stretchCoverPanels(), 800)
    window.setInterval(() => this.replaceInstruction(), 4000)
  }

  componentWillUnmount () {
    window.clearTimeout(() => this.stretchCoverPanels())
    window.clearInterval(() => this.replaceInstruction(), 4000)
  }

  render () {
    const { state, c } = this
    const { data } = state
    const singles = data ? data.singles : []
    const periods = data ? data.periods : []
    const notes = data ? data.notes : []
    const labels = data ? data.labels : [{}]

    /* Conditional css classes */
    const classes = [c]
    if (state.error) classes.push(`${c}_error`)
    if (state.intro_page) classes.push(`${c}_intro`)
    if (state.active_single_id !== null) classes.push(`${c}_with-player`)
    if (state.hide_label) classes.push(`${c}_hide-label`)

    /* [WIP] render an empty page if data is loading */
    if (state.loading || !state.data) return <div className={classes.join(' ')} />

    /* Display page */
    return <div className={classes.join(' ')}>
      <div className={`${c}__cover-panel-wrapper`}>
        <div className={`${c}__cover-panel`}
          style={{backgroundImage: `url(http://www.fubiz.net/wp-content/uploads/2017/08/davidbowie19670.jpg)`}}>
          <div className={`${c}__page-title`}>
            <SectionTitle huge level={1}>
              Nos vies<br />sous Bowie
            </SectionTitle>
          </div>
          <div className={`${c}__date-picker-block`}>
            <div className={`${c}__date-picker`}>
              <input
                type='date'
                ref={n => {this.$datePicker = n}}
                onChange={this.handleDateChange}
                defaultValue={moment().format('YYYY-MM-DD')} />
              <div className={`${c}__date-picker-label`}>
                {this.h2r.parse(labels[state.active_label].value)}
              </div>
            </div>
            <button className={`${c}__random-date`}
              onClick={this.handleRandomButtonClick}
              style={{backgroundImage: `url(${randomIcon})`}} />
          </div>
        </div>
      </div>
      <div className={`${c}__content-panel`}>
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
      }, {
        start: 14,
        end: 14,
        keysLinePos: 1
      }]
    })
    const res = {
      singles: data[0],
      periods: data[1],
      notes: data[2],
      labels: data[3]
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
    return new Promise((resolve, reject) => {
      const { state } = this
      if (state.intro_page) {
        this.setState({ intro_page: false })
        window.setTimeout(a => resolve(true), 200)
      } else {
        resolve()  
      }
    })
  }

  stretchCoverPanels () {
    const { state, c } =  this
    if (state.loading || !state.data) return
    if (!document.querySelector('body')) return
    if (!document.querySelector(`.${c}__cover-panel-wrapper`)) return
    if (!document.querySelector(`.${c}__cover-panel`)) return
    const vh = window.innerHeight
    const bodyPadding = document.querySelector('body').style.paddingTop || '65px'
    document.querySelector(`.${c}__cover-panel-wrapper`).style.height = `calc(${vh}px - ${bodyPadding})`
    document.querySelector(`.${c}__cover-panel`).style.height = `calc(${vh}px - ${bodyPadding})`
    document.querySelectorAll(`.${c}__chapter-name-mobile`).forEach(elt => elt.style.height = `calc(${vh}px - ${bodyPadding})`)
  }

  replaceInstruction () {
    const { state } = this
    const { data, active_label: activeLabel } = state
    const { labels } = data
    return new Promise((resolve, reject) => {
      this.setState({ hide_label: true })
      window.setTimeout(() => activeLabel >= labels.length - 1
        ? this.setState({
          active_label: 0,
          hide_label: false
        })
        : this.setState({
          active_label: activeLabel + 1,
          hide_label: false
        })
      , 400)
    })
  }

  async handleDateChange (e) {
    if (!e) return
    if (!e.target) return
    const { value } = e.target
    await this.leaveIntro()
    const date = moment(value, 'YYYY-MM-DD')
    if (!moment(date).isValid()) return
    this.scrollToAndActivateDate(date.valueOf())
  }

  async handleRandomButtonClick (e) {
    await this.leaveIntro()
    const { state } = this
    const { data } = state
    const singles = data ? data.singles : []
    const dates = singles.map(s => s.date.valueOf())
    const minDate = Math.min(...dates) + 1
    const maxDate = Math.max(...dates) + 1
    const timespan = maxDate - minDate
    const randomDate = Math.random() * timespan + minDate
    this.$datePicker.value = moment(randomDate, 'x').format('YYYY-MM-DD')
    this.scrollToAndActivateDate(randomDate)
  }

  scrollToAndActivateDate (val) {
    const { state, c } = this
    const { data } = state
    const singles = data ? data.singles : []
    const anteriorSingles = singles
      .filter(s => s.date.valueOf() <= val)
      .sort((s1, s2) => s1.date.valueOf() - s2.date.valueOf())
    if (!anteriorSingles.length) {
      const $firstChapter = document.querySelector(`.${c}__chapter:first-child`)
      const browserHeight = Math.max(window.innerHeight, window.innerHeight || 0)
      const offsetY = $firstChapter.offsetTop - browserHeight / 6
      window.scroll({
        top: offsetY,
        left: 0,
        behavior: 'smooth'
      })
      return this.setState({
        selected_date: val,
        active_single_id: null
      })
    }
    const latestSingle = anteriorSingles[anteriorSingles.length - 1]
    const { id: latestSingleId } = latestSingle
    const $latestSingle = document.querySelector(`.${c}__item[data-single-id="${latestSingleId}"]`)
    const $latestSingleContainer = this.$getClosestParent($latestSingle, `.${c}__items`)
    const browserHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    const browserWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
    const eltHeight = $latestSingle.offsetHeight
    const eltWidth = $latestSingle.offsetWidth
    const offsetX = $latestSingle.offsetLeft
    const offsetY = $latestSingle.offsetTop + (eltHeight / 2) - (browserHeight / 6)
    window.scroll({
      top: offsetY,
      left: 0,
      behavior: 'smooth'
    })
    $latestSingleContainer.scroll({
      top: 0,
      left: offsetX,
      behavior: 'smooth'
    })
    return this.setState({
      selected_date: val,
      active_single_id: latestSingleId
    })
  }

  // Copy pasted this from stackOverflow...
  $getClosestParent ( elem, selector ) {
    if (!Element.prototype.matches) {
      Element.prototype.matches =
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function (s) {
          const matches = (
            this.document ||
            this.ownerDocument
          ).querySelectorAll(s)
          let i = matches.length
          while (--i >= 0 && matches.item(i) !== this) {}
          return i > -1
        }
    }
    // Get closest match
    for ( ; elem && elem !== document; elem = elem.parentNode ) {
      if (elem.matches(selector)) return elem
    }
    return null
  }
}
