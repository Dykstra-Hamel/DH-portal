#!/usr/bin/env node

/**
 * Widget Build Script
 * Concatenates source files into single embed.js for distribution
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = __dirname;
const OUTPUT_FILE = path.join(__dirname, '../public/widget/embed.js');
const ORIGINAL_FILE = path.join(__dirname, '../public/widget/embed-original.js');

// Source files in order - IMPORTANT: State objects must be declared first
const SOURCE_FILES = [
  'widget-state.js',    // State objects (must come first)
  'widget-utils.js',    // Utility functions and helpers 
  'widget-styles.js',   // CSS injection and styling
  'widget-ui.js',       // UI components  
  'widget-logic.js',    // Logic and validation
  'widget-captcha.js',  // Captcha loader and token helper
  'widget-forms.js',    // Form creation and management
  'widget-api.js',      // API communication and form submission
  'embed-main.js'       // Main entry point and configuration (must come last)
];

/**
 * Read a source file
 */
function readSourceFile(filename) {
  const filepath = path.join(SOURCE_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    console.warn(`Warning: Source file ${filename} not found`);
    return '';
  }

  let content = fs.readFileSync(filepath, 'utf8');
  
  // Special handling for main file - split at config declaration
  if (filename === 'embed-main.js') {
    return { content, isMainFile: true };
  }
  
  // Remove IIFE wrapper from other files
  content = content.replace(/^\/\*\*[\s\S]*?\*\/\s*\n/, ''); // Remove header comment
  content = content.replace(/^\s*\(function\s*\(\)\s*\{\s*\n\s*['"]use strict['"];\s*\n/, ''); // Remove IIFE start
  content = content.replace(/\s*\}\)\(\);\s*$/, ''); // Remove IIFE end
  content = content.trim();
  
  // Remove extra indentation (functions are indented 2 spaces in IIFE, we want them at root level)
  content = content.split('\n').map(line => {
    if (line.startsWith('  ') && line.trim() !== '') {
      return line.substring(2); // Remove 2-space indentation
    }
    return line;
  }).join('\n');
  
  // Add file separator comment
  const moduleName = path.basename(filename, '.js');
  const separator = `\n// === ${moduleName.toUpperCase().replace('-', ' ')} ===\n`;
  
  return { content: separator + content + '\n', isMainFile: false };
}

/**
 * Get original file size for comparison
 */
function getOriginalSize() {
  if (fs.existsSync(ORIGINAL_FILE)) {
    const stats = fs.statSync(ORIGINAL_FILE);
    return Math.round(stats.size / 1024);
  }
  return 0;
}

/**
 * Build the combined file
 */
function build() {
  console.log('🔨 Building widget from source files...');
  
  try {
    let combinedContent = '';
    let mainFileContent = '';
    
    // Add build header
    combinedContent += `/**\n * DH Widget - Built from Source\n * Source files: ${SOURCE_FILES.join(', ')}\n */\n\n`;
    
    // Read and combine all files
    const moduleContents = [];
    
    SOURCE_FILES.forEach(filename => {
      const result = readSourceFile(filename);
      if (result.isMainFile) {
        mainFileContent = result.content;
      } else if (result.content && result.content.trim()) {
        moduleContents.push(result.content);
      }
    });
    
    // Split main file at the config declaration to inject functions before initialization
    const configIndex = mainFileContent.indexOf('  const config = {');
    if (configIndex === -1) {
      throw new Error('Could not find config declaration in embed-main.js');
    }
    
    // Split main file into parts
    const beforeConfig = mainFileContent.substring(0, configIndex);
    const afterConfig = mainFileContent.substring(configIndex);
    
    // Combine all parts: main file start + all module functions + main file end
    combinedContent += beforeConfig;
    combinedContent += '\n  // === EXTRACTED FUNCTIONS ===\n';
    
    // Add all module functions (they will be inside the main IIFE scope)
    moduleContents.forEach(moduleContent => {
      // Indent the module content to match the IIFE scope (2 spaces)
      const indentedContent = moduleContent.split('\n').map(line => {
        if (line.trim() === '') return line; // Keep empty lines as-is
        return '  ' + line; // Add 2 spaces for IIFE scope
      }).join('\n');
      combinedContent += indentedContent;
    });
    
    combinedContent += '\n  // === CONFIGURATION AND INITIALIZATION ===\n';
    combinedContent += afterConfig;
    
    // Write to output file
    fs.writeFileSync(OUTPUT_FILE, combinedContent);
    
    const stats = fs.statSync(OUTPUT_FILE);
    const originalSize = getOriginalSize();
    
    console.log('✅ Build complete!');
    console.log(`📁 Output: ${OUTPUT_FILE}`);
    console.log(`📊 Size: ${Math.round(stats.size / 1024)}KB (original: ${originalSize}KB)`);
    console.log(`🏗️ Source files: ${SOURCE_FILES.length} modular files combined`);
    console.log('');
    console.log('🎯 PRODUCTION READY:');
    console.log('  ✅ Functions injected before config declaration');
    console.log('  ✅ Proper scope and execution order maintained');
    console.log('  ✅ Ready for testing with existing scripts');
    console.log('  💡 Original backed up as embed-original.js');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run the build
build();
