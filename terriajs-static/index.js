const matter = require('gray-matter');
const fs = require('fs');
const showdown = require('showdown');
const Mustache = require('mustache');
const {promisify} = require('util');
const readDirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const converter = new showdown.Converter();
let config ;

try{
 const configPath = process.cwd() + '/wwwroot/static-page-config.js';
 config = require(configPath);
} catch(e){
  if(e.code !=='MODULE_NOT_FOUND'){
    throw e;
  }
 config = require('./config.js');
};

console.log("generating pages with the following config: \n ",  config);

const markdown = config.markdown || __dirname + '/markdown';
const dist = config.dist;
const template = config.template || __dirname + '/template';

function parseNestedMenuItems(menuItemsRaw, fileName){
  if(menuItemsRaw && menuItemsRaw.length > 0){
     return menuItemsRaw.map((group) => {
       return {title: group.title,
              items: group.items.map((item, index) =>{
                const id= '#' + item.title.toLowerCase().replace(/\s/g, "-");
                return {title: item.title,
                        url: id
                      }
              })}
     })
  }
  return [];
}

async function cookHtml(content, fileTitle){
  try{
    const contentHtml = converter.makeHtml(content.content);
    const data = await readFileAsync(template +'/wrapper.mst', {encoding: 'utf8'});
    
    const imageSidebarItems = content.data.imageSidebarItems;
    const menuSidebarItemsRaw = content.data.menuSidebarItems;
    const menuSidebarItems = parseNestedMenuItems(menuSidebarItemsRaw, fileTitle + 'html');
    const partialFiles = await readDirAsync(template + '/partials', {encoding: 'utf8'});
    
    const partials = {};
    for(let i = 0; i < partialFiles.length; i ++){
      const partial = await readFileAsync(template + '/partials/' + partialFiles[i], {encoding: 'utf8'})
      partials[partialFiles[i]] = partial
    }
    
    const footerCredit = config.footerCredit;
    return  Mustache.render(data.toString(), {appName: config.appName,
                                             content: contentHtml,
                                             title: content.data.title,
                                             id:fileTitle,
                                             footerCredit,
                                             navItems: parseNavItems(config.navItems, fileTitle),
                                             imageSidebarItems,
                                             menuSidebarItems},
                                             partials
                                             );
  }
  
  catch(err){
    console.log('ERROR', err)
  }
}

function parseNavItems(navs, docName){
  return navs.map(function(nav){
    return {
      title: nav.title, 
      url: nav.url,
      class: nav.title.toLowerCase() === docName.toLowerCase() ? 'active' : ''
    }
  })
}


async function writeFile(fileName, output){
  try{
    await writeFileAsync(dist + '/' + fileName, output);
    console.log(dist + '/' + fileName + " has been saved")
  }
  catch(err){
    console.log('ERROR', err);
  }
}

async function generateHtml(file){
  try{
    if(file.split('.').pop() !== 'md'){
      console.log('ignoreing invalid file: '+ file);
      return false;
    }
    const content = matter.read(markdown + '/' + file, {encoding: 'utf8'});
    const temp = content.data.template;
    const fileTitle = content.data.title.toString().toLowerCase();
    const fileName = fileTitle + '.html';
    let output;
    
    if(temp === 'normal'){
        output = await cookHtml(content, fileTitle);
    } else {
      // allow for custom rendering
      if(typeof config.customRender === 'function'){
        output = config.customRender(content, fileTitle);
      }
    }
    
    writeFile(fileName, output);
  }
  catch(err){
    console.log('ERROR', err);
  }
}

async function loadContent(){
  try{
    const files = await readDirAsync(markdown);
    for( let i = 0; i < files.length; i ++){
      const file = files[i];
      generateHtml(file);
    }
  }
  catch(err){
    console.log('ERROR', err);
  }
}

loadContent();
