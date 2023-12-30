/**
 * this is a fork of https://www.npmjs.com/package/epub-metadata
 * just copy-pasted the code from the original source and modified it to work with my epub files
 */

var path = require('path'),

	fsp = require('fs-promise'),
	JsZip = require('jszip'),
	xmlMapping = require('xml-mapping')
const {isObject, isArray} = require("util");


function cleanUpMetadata (key, value) {
  if (value === undefined) {
    value = null;
  }
	// Remove namespace part from keys
	if (typeof key === 'string' && /\$/.test(key)) {
		var newKey = key.split('$')[1]
		this[newKey] = value
		delete this[key]
		key = newKey
	}

	// Make text property the actual value
	if (isObject(value) && value.hasOwnProperty('$text') &&
		Object.keys(value).length === 1) {
		this[key] = value.$text
	}

	return value
}

function loadDcMetadata (json, metadata) {
  if (!json.package?.metadata) {
    return;
  }
	for (var key in json.package.metadata) {
		if (key.search('dc') === 0) {
			!function () {
				var newKey = key.replace(/^dc\$/, '')
				metadata[newKey] = json.package.metadata[key]
			}()
		}
	}
}

function rewriteMetaElements (json) {
  if (!json.package?.metadata?.meta) {
    return
  }
  if (!isArray(json.package.metadata.meta)) {
    json.package.metadata.meta = [json.package.metadata.meta];
  }

	json.package.metadata.meta.forEach(function (meta) {
		json.package.metadata['dc$' + meta.name] = meta.content
	})
	delete json.package.metadata.meta
}

function getCoverImagePath (contentPath, coverId, json) {
  if (!json.package?.manifest?.item) {
    return;
  }
	var href = ''
	json.package.manifest.item.some(function (item) {
		if (item.id === coverId) {
			href = path.join(contentPath, '..', item.href)
			return true
		}
	})
	return href
}

module.exports = function (epubPath) {

	return fsp
		.readFile(epubPath)
		.then(function (fileContent) {

			var epub = new JsZip(fileContent),
				metadata = {},
				contentPaths = [
					'content.opf',
					'OEBPS/content.opf'
				],
				contentPath,
				json,
				xml

			contentPaths.some(function (contentFilePath) {
				xml = epub.file(contentFilePath)
				contentPath = contentFilePath
				return Boolean(xml)
			})

			if (!xml)
				throw new Error(
					'The software was not able to locate ' +
					'a content.opf file in ' + epubPath
				)

			json = xmlMapping.load(xml.asText(), {longTag: true})
      // return json;
      if (!json.package) {
        json.package = json.ns0$package;
        //ns0$metadata, ns0$manifest, ns0$spine, ns0$guide
        json.package.metadata = json.package.ns0$metadata ?? json.package.metadata;
        json.package.manifest = json.package.ns0$manifest ?? json.package.manifest;
        json.package.spine = json.package.ns0$spine ?? json.package.spine;
        json.package.guide = json.package.ns0$guide ?? json.package.guide;
        //ns1$title, ns1$rights, ns1$identifier
        json.package.metadata.dc$title = json.package.metadata.ns1$title ?? json.package.metadata.dc$title;
        json.package.metadata.dc$rights = json.package.metadata.ns1$rights ?? json.package.metadata.dc$rights;
        json.package.metadata.dc$identifier = json.package.metadata.ns1$identifier ?? json.package.metadata.dc$identifier;
      }

			rewriteMetaElements(json)

			loadDcMetadata(json, metadata)

			// This is a little hack to iterate recursively over an object
			JSON.stringify(metadata, cleanUpMetadata)

			// Use keys for identifiers
			if (!Array.isArray(metadata.identifier))
				metadata.identifier = [metadata.identifier]

			metadata.identifier.forEach(function (identifier) {
        if (identifier) {
          if (typeof identifier === 'object') {
            identifier.text = identifier.text || 'unk'
            identifier.scheme = identifier.scheme || identifier.id ||identifier.text

            metadata[identifier.scheme.toLowerCase()] = identifier.text
          }
          if (typeof identifier === 'string') {
            metadata[identifier] = identifier
          }
        }
			})

			delete metadata.identifier

			metadata.coverPath = getCoverImagePath(
				contentPath,
				metadata.cover,
				json
			)

			return metadata
		})
		.catch(function (error) {
			console.error(error.stack)
		})
}
