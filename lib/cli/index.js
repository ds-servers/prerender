/*





*/
/*
 * @page index DSSRV
 * @tag home
 *
 * ###DIREKTSPEED Server
 *
 * Our DSSRV only has two classes:
 *
 * * server
 * * server
 */
// needs reading of $PWD for accepting .
var nodePath      = require("path")
var program       = require("commander")
var fse           = require("fs-extra")
var downloadRepo  = require("download-github-repo")
var pkg           = require("../../package.json")

var prerender     = require("../")()


var output = function(msg){
  var v = pkg.version
  console.log("------------")
  console.log("DIREKTSPEED Server - Modul Prerender v" + v + " – DIREKTSPEED. 2015–2017")
  if(msg){
    console.log(msg)
    console.log("Press Ctl+C to stop the server")
  }
  console.log("------------")
}

program
  .version(pkg.version)

program
  .command("init [path]")
  .usage("initializes a new DIREKTSPEED Server - PreRender project in the current directory.\n  See available boilerplates at https://github.com/dssrv-boilerplates")
  .option("-b, --boilerplate <github-username/repo>", "use a github repo as a boilerplate", "dssrv-boilerplates/default")
  .description("Initialize a new DIREKTSPEED Server project in current directory")
  .action(function(path, program){
    var projectPath     = nodePath.resolve(process.cwd(), path || "")
    var boilerplatePath = nodePath.resolve(__dirname, "..", "lib", "default_boilerplate")
    var repo            = program.boilerplate

    // Assume `harp-boilerplates` github org if boilerplate doesn't contain a slash
    repo.match(/\//) || (repo = "dssrv-boilerplates/"+repo)

    var done = function() {
      console.log("Initialized project at", projectPath)
    }

    fse.mkdirp(projectPath, function(err){
      if(err) return err

      fse.readdir(projectPath, function(err, contents){

        if(err) return err

        if(contents.length !== 0){
          console.log("Sorry,", projectPath, "must be empty.")
          return
        }

        console.log("Downloading boilerplate: https://github.com/"+repo)

        //fse.writeFileSync("/Desktop/harp-test-output.txt", repo + "::" + projectPath)

        downloadRepo(repo, projectPath, function(err) {
          if (!err) return done()

          if (require('util').isError(err) && err['code'] === 'ENOTFOUND') {
            console.error("You're not connected to the Internet, so we'll use the default boilerplate.")
            fse.copy(boilerplatePath, projectPath, function(err){
              if (err) return err
              return done()
            })
          } else {
            return console.error("Template not found:", "https://github.com/"+repo)
          }

        })

      })
    })
  })

program
  .command("server [path]")
  .option("-i, --ip <ip>", "Specify IP to bind to")
  .option("-p, --port <port>", "Specify a port to listen on")
  .option("-c, --config <path>", "Specify a port to listen on")
  .usage("starts a DIREKTSPEED Server in current directory, or in the specified directory.")
  .description("Start a DIREKTSPEED Server in current directory")
  .action(function(path, program){
    var projectPath = nodePath.resolve(process.cwd(), path || "")
    var ip          = program.ip || '0.0.0.0'
    var port        = program.port || 9000
    var options = {
      ip: ip,
      port: port
    }

    prerender.server(projectPath, options, function(){
      var address = ''
      if(ip == '0.0.0.0' || ip == '127.0.0.1') {
        address = 'localhost'
      } else {
        address = ip
      }
      var hostUrl = "http://" + address + ":" + port + "/"
      output("Your server is listening at " + hostUrl)
    })
  })

program
  .command("multihost [path]")
  .option("-i, --ip <ip>", "Specify IP to bind to")
  .option("-p, --port <port>", "Specify a port to listen on")
  .option("-c, --config <path>", "Specify a port to listen on")
  .usage("starts a DIREKTSPEED Server to host a directory of DIREKTSPEED Server projects.")
  .description("Start a DIREKTSPEED Server to host a directory of DIREKTSPEED Server projects")
  .action(function(path, program){
    var projectPath = nodePath.resolve(process.cwd(), path || "")
    var port        = program.port || 9000
    var options = {
      port: port
    }

    prerender.multihost(projectPath, options, function(){
      if(port == "80"){
        var loc = "http://localhost"
      }else{
        var loc = "http://localhost:" + port
      }
      output("Your server is hosting multiple projects at " + loc)
    })
  })

program
  .command("compile [projectPath] [outputPath]")
  .option("-o, --output <path>", "Specify the output directory for compiled assets (relative to project path)")
  .usage("compile your project files to static assets (HTML, JS and CSS). \n  Use this command if you want to host your application without using the DIREKTSPEED Server web server.")
  .description("Compile project to static assets (HTML, JS and CSS)")
  .action(function(projectPath, outputPath, program){

    if(!program){
      program    = outputPath
      outputPath = null
    }

    projectPath = nodePath.resolve(process.cwd(), projectPath || "")

    /**
     * We deal with output path 3 different ways
     *
     *  1. second argument (relative to directory called in)
     *  2. `--output` argument (relative to project root)
     *  3. implicitly projectPath + "/www"
     *
     */

    if(outputPath){
      outputPath = nodePath.resolve(process.cwd(), (outputPath || program.output || ''))
    }else{
      outputPath = nodePath.resolve(projectPath, (program.output || "www"))
    }

    prerender.compile(projectPath, outputPath, function(errors, output){
      if(errors) {
        console.log(JSON.stringify(errors, null, 2))
        process.exit(1)
      }
    })
  })

program.on("--help", function(){
  console.log("  Use 'dssrv <command> --help' to get more information or visit http://server.dspeed.eu/ to learn more.")
  console.log('')
})




module.exports = program
