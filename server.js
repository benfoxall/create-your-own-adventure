require('dotenv-safe').load()

const Nexmo = require('nexmo')
const express = require('express')
const bodyParser = require('body-parser')
const adventure = require('./adventure.json')


const app = express()
const nexmo = new Nexmo({
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET,
    applicationId: process.env.APP_ID,
    // privateKey: `./keys/${process.env.APP_ID}.key`
})


app.get('/', (req, res) => res.send(`For adventures, call ${process.env.NUMBER}`))

app.get('/answer', (req, res) => {
  res.send(ask('start'))
})

app.use(bodyParser.json())

app.post('/reply/:state', (req, res) => {

  const stateName = req.params.state
  const choice = req.body.dtmf

  if(!adventure[stateName]) {
    return res.send([{
      action: 'talk',
      text: "Couldn't find state"
    }])
  }

  // find where they want to go
  const next =
    (adventure[stateName].choices||[])
    .find(c => c.dtmf == choice)

  if(next) {
    res.send(ask(next.state))
  } else {
    res.send(ask(stateName))
  }

})

app.listen(process.env.PORT || 3000)


function ask(stateName){
  const state = adventure[stateName]
  const commands = []

  commands.push({
    "action": "talk",
    "text": state.text
  })

  if(state.choices) {
    state.choices.forEach( choice =>
      commands.push({
        "action": "talk",
        "text": `to ${choice.text} press ${choice.dtmf}`
      })
    )

    commands.push({
      "action": "input",
      "maxDigits": 1,
      "timeOut": 10,
      "eventUrl": [`https://${process.env.HOST}/reply/${stateName}`]
    })

  }

  return commands

}
