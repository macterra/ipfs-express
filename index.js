const ipfsClient = require('ipfs-http-client')
const express = require('express')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const fs = require('fs')
const CID = require('cids')
const uint8ArrayConcat = require('uint8arrays/concat')
const uint8ArrayToString = require('uint8arrays/to-string')

const ipfs = new ipfsClient({host:'localhost', port: '5001', protocol:'http'})
const app = express()

app.set('view engine','ejs')
app.use(bodyParser.urlencoded({extended:true}))
app.use(fileUpload())


app.get('/', (req,res) => {
    res.render('home')
    console.log('home hit')
})

app.post('/upload', (req, res) => {
    const file = req.files.file
    const fileName = req.files.file.name
    const filePath =   'files/' + fileName

    file.mv(filePath, async (err) => {
        if (err) {
            console.log('error: failed to download the file.')
            return res.status(500).send(err)
        }
     
        const fileHash = await addFile(fileName, filePath)

        fs.unlink(filePath, (err) => {
            if (err) console.log(err)
        })
         
        res.render('upload', {fileName, fileHash})
    })
})

app.post('/download', (req, res) => {
    const cid = req.body.cid
    const content = getFile(cid)

    content.then(data => {
        console.log('downloaded:', data)          
        res.render('download', {cid, data})
    })        
})

const addFile = async (fileName, filePath) => {
    const file = fs.readFileSync(filePath)
    const fileAdded = await ipfs.add({path:fileName, content:file})
    const fileHash = fileAdded.cid

    console.log(fileAdded)

    meta = { 
        did: "urn:uuid:53572cf1-556a-4844-bc26-057bfc27432e", 
        cid: fileHash.string 
    }
    console.log(meta)

    const metaAdded = await ipfs.add(JSON.stringify(meta))
    console.log(metaAdded)
    
    return metaAdded.cid
}

const getFile = async (cid) => {
    
    const chunks = []
    
    for await (const chunk of ipfs.cat(cid)) {
        chunks.push(chunk)
    }

    data = uint8ArrayConcat(chunks)
    content = uint8ArrayToString(data)

    return content
}

app.listen(3000,'127.0.0.1', () => {
    console.log('Server is running on port 3000')
})