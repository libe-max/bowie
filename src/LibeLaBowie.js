import React, { Component } from 'react'
import { Parser } from 'html-to-react'
import YouTube from 'react-youtube'
import moment from 'moment'
import 'moment/locale/fr'

import SectionTitle from 'libe-components/lib/text-levels/SectionTitle'
import Hat from 'libe-components/lib/text-levels/Hat'
import ParagraphTitle from 'libe-components/lib/text-levels/ParagraphTitle'
import Paragraph from 'libe-components/lib/text-levels/Paragraph'
import Slug from 'libe-components/lib/text-levels/Slug'
import AnnotationTitle from 'libe-components/lib/text-levels/AnnotationTitle'
import Annotation from 'libe-components/lib/text-levels/Annotation'
import squareImg from './assets/square.jpg'
import closeIcon from './assets/close-icon.svg'
import randomIcon from './assets/random-icon.svg'
import facebookIcon from './assets/facebook-icon.svg'
import twitterIcon from './assets/twitter-icon.svg'
import libeLaboLogo from './assets/libe-labo-logo.png'

import { parseTsvWithTabs } from 'libe-utils/parse-tsv'
import { spreadsheet } from './config.json'

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
    this.chaptersPositions = []
    this.lastScrollEvent = 0
    this.currentChapterId = 1
    this.fetchData = this.fetchData.bind(this)
    this.h2r = new Parser()
    this.leaveIntro = this.leaveIntro.bind(this)
    this.handleDateChange = this.handleDateChange.bind(this)
    this.handleRandomButtonClick = this.handleRandomButtonClick.bind(this)
    this.handleFacebookShare = this.handleFacebookShare.bind(this)
    this.handleTwitterShare = this.handleTwitterShare.bind(this)
    this.handleTwitterShareArticle = this.handleTwitterShareArticle.bind(this)
    this.stretchCoverPanels = this.stretchCoverPanels.bind(this)
    this.getChaptersWithBoundaries = this.getChaptersWithBoundaries.bind(this)
    this.checkAndReplaceSideImage = this.checkAndReplaceSideImage.bind(this)
    this.replaceInstruction = this.replaceInstruction.bind(this)
    this.scrollToAndActivateDate = this.scrollToAndActivateDate.bind(this)
    this.$getClosestParent = this.$getClosestParent.bind(this)
    this.fetchData()
    window.setTimeout(() => this.stretchCoverPanels(), 1200)
    window.setInterval(() => this.getChaptersWithBoundaries(), 2000)
    window.setTimeout(() => {
      this.replaceInstruction()
      window.setInterval(() => this.replaceInstruction(), 3500)
    }, 2000)
    window.addEventListener('scroll', this.checkAndReplaceSideImage)
  }

  componentWillUnmount () {
    window.clearTimeout(() => this.stretchCoverPanels())
    window.clearInterval(() => this.getChaptersWithBoundaries(), 2000)
    window.clearTimeout(() => {
      this.replaceInstruction()
      window.setInterval(() => this.replaceInstruction(), 3500)
    })
    window.clearInterval(() => this.replaceInstruction(), 3500)
    window.removeEventListener('scroll', e => console.log(e))
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
          style={{backgroundImage: `url(http://www.liberation.fr/apps/uploads/bowie/cover.jpg)`}}>
          <div className={`${c}__cover-panel-inner`}>
            <div className={`${c}__page-title`}>
              <SectionTitle big level={1}>
                Nos vies<br />sous Bowie
              </SectionTitle>
            </div>
            { state.intro_page
              ? <div className={`${c}__page-intro ${c}__page-intro_desktop`}>
                  <Paragraph><em>Libé</em> vous propose de revisiter les grandes dates de votre vie en parcourant la carrière de David Bowie, mort le 10 janvier 2016, à partir de l'intégralité des singles qu'il a publiés.</Paragraph>
                </div>
              : ''
            }
            { state.intro_page
              ? <div className={`${c}__page-intro ${c}__page-intro_mobile`}>
                  <Annotation>{`
Revisitez les grands moments de votre vie en parcourant la carrière de Bowie. Entrez une date ci-dessous.`}
                  </Annotation>
                </div>
              : ''
            }
            <div className={`${c}__date-picker-incentive`}>
              <ParagraphTitle small>
                Choisissez une date ci-dessous
              </ParagraphTitle>
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
      </div>
      <div className={`${c}__content-panel`}>
        <div className={`${c}__chapters`}>{
          periods.map((period, i) => (
            <section className={`${c}__chapter`} data-id={period.id} key={i}>
              <div className={`${c}__chapter-name`}>
                <div className={`${c}__chapter-name-desktop`}>
                  <div className={`${c}__chapter-timespan`}><Slug>{
                    (() => {
                      const startYear = moment(period.start_date, 'DD/MM/YYYY').format('YYYY')
                      const endYear = moment(period.end_date, 'DD/MM/YYYY').format('YYYY')
                      return `${startYear} – ${endYear}`
                    })()
                  }</Slug></div>
                  <SectionTitle level={2}>{period.period}</SectionTitle>
                </div>
                <div className={`${c}__chapter-name-mobile`}
                  style={{backgroundImage: `url(${period.image})`}}>
                  <SectionTitle level={2}>{period.period}</SectionTitle>
                </div>
              </div>
              <div className={`${c}__chapter-content`}>
                <Paragraph>{period.text}</Paragraph>
              </div>
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
                      <div className={`${c}__item-name`}>
                        <Paragraph>{single.single_name}</Paragraph>
                      </div>
                      <div className={`${c}__item-label`}>
                        <Paragraph>{single.display_date}</Paragraph>
                      </div>
                    </div>
                  })
                })()}
                <div className={`${c}__item-right-spacer`} />
              </div>
            </section>
          ))
        }</div>
        <div className={`${c}__credits`}>
          <AnnotationTitle>Production</AnnotationTitle>
          <Annotation>
            Une application réalisée par Christelle Causse, Maxime Fabas et Guillaume Lecaplain pour Libé Labo.<br/>
            Textes adaptés de <a href='https://next.liberation.fr/culture/2016/01/11/la-derniere-mort-de-david-bowie_1425797'>l'article paru le 11 janvier 2016</a> par Julien Gester et Didier Péron.
          </Annotation>
          <AnnotationTitle>Crédits photo</AnnotationTitle>
          <Annotation>Rue des Archives / United Archives – GAMMA – Andre Csillag / Fastimage – Zumapress / Leemage – Christian Rose / Fastimage – Luciano Viti / LUZphoto / Leemage – Jorgen Angel / Fastimage – GettyImages – AFP</Annotation>
        </div>
        <div className={`${c}__share`}>
          <div className={`${c}__active-single-share-actions`}>
            <button
              className={`${c}__active-single-share-facebook`}
              onClick={this.handleFacebookShare}
              style={{backgroundImage: `url(${facebookIcon})`}} />
            <button
              className={`${c}__active-single-share-twitter`}
              onClick={this.handleTwitterShareArticle}
              style={{backgroundImage: `url(${twitterIcon})`}} />
          </div>
        </div>
        <div className={`${c}__lblb-logo`}>
          <a href='https://www.liberation.fr/libe-labo-data-nouveaux-formats,100538' target='_blank'><img src={libeLaboLogo} /></a>
        </div>
        <div className={`${c}__player-panel-spacer`} />
      </div>
      <div className={`${c}__player-panel`}>
        {(() => {
          const id = state.active_single_id
          if (id === null) return ''
          const selectedDate = state.selected_date
          // const displaySelectedDate = moment(selectedDate, 'x').format('Do MMMM YYYY')
          const activeSingle = singles.filter(s => s.id === id)[0]
          let latestSingle = singles[0]
          singles.forEach(single => {
            if (single.date.valueOf() <= selectedDate) latestSingle = single
          })
          let displaySelectedDate = ''
          let sentence = ''
          if (latestSingle.id === activeSingle.id) {
            displaySelectedDate = moment(selectedDate, 'x').format('Do MMMM YYYY')
            sentence = ', le dernier single de Bowie était'
          } else {
            displaySelectedDate = moment(activeSingle.date, 'x').format('Do MMMM YYYY')
            sentence = ' David Bowie sortait un nouveau single'
          }
          const { single_url: singleUrl } = activeSingle
          const videoId = singleUrl.replace('https://youtu.be/', '')
          return <div className={`${c}__player`}>
            <div className={`${c}__active-single-info`}>
              <div>
                <div className={`${c}__active-single-label`}>
                  <Annotation>Le {displaySelectedDate}{sentence} :</Annotation>
                </div>
                <div className={`${c}__active-single-name`}>
                  <Paragraph>{activeSingle.single_name}</Paragraph>
                </div>
              </div>
              <div className={`${c}__active-single-share`}>
                <div className={`${c}__active-single-share-label`}>
                  <AnnotationTitle>Partager</AnnotationTitle>
                </div>
                <div className={`${c}__active-single-share-actions`}>
                  <button
                    className={`${c}__active-single-share-facebook`}
                    onClick={this.handleFacebookShare}
                    style={{backgroundImage: `url(${facebookIcon})`}} />
                  <button
                    className={`${c}__active-single-share-twitter`}
                    onClick={this.handleTwitterShare}
                    style={{backgroundImage: `url(${twitterIcon})`}} />
                </div>
              </div>
            </div>
            <YouTube videoId={videoId} />
          </div>
        })()}
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
        end: 14,
        keysLinePos: 1,
        types: {
          id: 'number',
          start_date: val => moment(val, 'DD/MM/YYYY'),
          end_date: val => moment(val, 'DD/MM/YYYY'),
        }
      }, {
        start: 15,
        end: 15,
        keysLinePos: 1
      }, {
        start: 16,
        end: 16,
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
    this.getChaptersWithBoundaries()
    return new Promise((resolve, reject) => {
      const { state } = this
      if (state.intro_page) {
        this.setState({ intro_page: false })
        window.setTimeout(a => resolve(true), 500)
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

  getChaptersWithBoundaries () {
    const { state, c } = this
    const { data } = state
    const periods = data ? data.periods : []
    if (state.intro_page) return
    const $chapters = document.querySelectorAll(`.${c}__chapter`)
    const browserHeight = Math.max(window.innerHeight, window.innerHeight || 0)
    const res = []
    $chapters.forEach(node => {
      const treshold = node.offsetTop - browserHeight / 3
      const id = parseInt(node.getAttribute('data-id'), 10)
      const period = periods.filter(s => s.id === id)[0]
      res.push({ treshold, period })
    })
    this.chaptersPositions = res
  }

  checkAndReplaceSideImage (e) {
    this.lastScrollEvent = moment().valueOf()
    window.setTimeout(() => {
      const now = moment().valueOf()
      const endScroll = (now - this.lastScrollEvent) >= 148
      if (!endScroll) return
      const { chaptersPositions, c } = this
      const scrollLevel = document.documentElement.scrollTop
      let currentChapter = chaptersPositions[chaptersPositions.length - 1]
      chaptersPositions.some((chapter, i) => {
        if (chapter.treshold > scrollLevel) {
          if (i === 0) currentChapter = chapter
          else currentChapter = chaptersPositions[i - 1]
          return true
        }
      })
      if (currentChapter) {
        if (currentChapter.period.id === this.currentChapterId) return
        this.currentChapterId = currentChapter.period.id
        document.querySelector(`.${c}__cover-panel`).style.transition = 'background-image 200ms'
        document.querySelector(`.${c}__cover-panel`).style.backgroundImage = `url(${currentChapter.period.image})`
      }
    }, 150)
  }

  replaceInstruction () {
    const { state } = this
    const { data, active_label: activeLabel } = state
    if (!data) return
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

  handleFacebookShare (e) {
    const articleUrl = document.querySelector('meta[property="og:url"]').getAttribute('content')
    const facebookUrl = 'http://www.facebook.com/sharer/sharer.php?u=' + articleUrl
    const features = 'width=575,height=400,menubar=no,toolbar=no'
    window.open(facebookUrl, '', features)
  }

  handleTwitterShare (e) {
    const { state } = this
    const { data, selected_date: selectedDate } = state
    const { singles } = data
    const id = state.active_single_id
    const activeSingle = singles.filter(s => s.id === id)[0]
    let latestSingle = singles[0]
    singles.forEach(single => {
      if (single.date.valueOf() <= selectedDate) latestSingle = single
    })
    let displaySelectedDate = ''
    if (latestSingle.id === activeSingle.id) displaySelectedDate = moment(selectedDate, 'x').format('Do MMMM YYYY')
    else displaySelectedDate = moment(activeSingle.date, 'x').format('Do MMMM YYYY')
    const { single_name: singleName } = activeSingle
    const txt = `
Le ${displaySelectedDate}, c'était un jour spécial pour moi et David Bowie venait de sortir «${singleName}».
 Et vous, quel single chantait-il lors des journées qui ont compté pour vous ?`
    const features = 'width=575,height=400,menubar=no,toolbar=no'
    const url = document.querySelector('meta[name="twitter:url"]').getAttribute('content')
    const via = document.querySelector('meta[name="custom:tweet-via"]').getAttribute('content')
    const tweet = `${txt} ${url} via ${via}`
    const twitterUrl = `https://twitter.com/intent/tweet?original_referer=&text=${tweet}`
    window.open(twitterUrl, '', features)
  }

  handleTwitterShareArticle (e) {
    const txt = `
Revisitez les grands moments de votre vie en parcourant la carrière de David Bowie`
    const features = 'width=575,height=400,menubar=no,toolbar=no'
    const url = document.querySelector('meta[name="twitter:url"]').getAttribute('content')
    const via = document.querySelector('meta[name="custom:tweet-via"]').getAttribute('content')
    const tweet = `${txt} ${url} via ${via}`
    const twitterUrl = `https://twitter.com/intent/tweet?original_referer=&text=${tweet}`
    window.open(twitterUrl, '', features)
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
    const $latestSingleChapter = this.$getClosestParent($latestSingle, `.${c}__chapter`).querySelector(`.${c}__chapter-name`)
    const browserHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    const chapterHeight = $latestSingleChapter.offsetHeight
    const offsetX = $latestSingle.offsetLeft
    const offsetY = $latestSingleChapter.offsetTop + chapterHeight - (browserHeight / 6)
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
