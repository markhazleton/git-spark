/**
 * File filtering helpers for HTML report hotspot generation.
 * Determines which files are source code vs config/documentation.
 */
import { FileFilteringConfig } from '../types/index.js';

export function isSourceCodeFile(filePath: string, config: FileFilteringConfig): boolean {
  const path = filePath.toLowerCase();

  for (const pattern of config.excludePatterns) {
    if (path.includes(pattern)) {
      return false;
    }
  }

  const hasConfigExtension = config.configExtensions.some(ext => path.endsWith(ext));
  if (hasConfigExtension) {
    return false;
  }

  return config.sourceCodeExtensions.some(ext => path.endsWith(ext));
}

export function getDefaultFileFilteringConfig(): FileFilteringConfig {
  return {
    sourceCodeExtensions: [
      // Web languages
      '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
      '.css', '.scss', '.sass', '.less',

      // Backend/System languages
      '.cs', '.vb', '.fs',
      '.java', '.kt', '.scala',
      '.py', '.pyx',
      '.rb', '.rake',
      '.php', '.php3', '.php4', '.php5', '.php7', '.php8',
      '.go',
      '.rs',
      '.cpp', '.cxx', '.cc', '.c',
      '.h', '.hpp', '.hxx',
      '.swift',
      '.m', '.mm',
      '.dart',
      '.ex', '.exs',
      '.erl', '.hrl',
      '.clj', '.cljs', '.cljc',
      '.hs', '.lhs',
      '.ml', '.mli',
      '.elm',
      '.lua',
      '.r', '.rmd',
      '.jl',
      '.zig',
      '.nim',
      '.cr',

      // Database and query languages
      '.sql', '.plsql', '.psql',

      // Scripting
      '.sh', '.bash', '.zsh', '.fish',
      '.ps1', '.bat', '.cmd',
      '.pl', '.pm',
      '.tcl',

      // Graphics and markup languages (source code context)
      '.xml', '.xaml', '.graphql', '.gql',

      // Template languages
      '.mustache', '.hbs', '.handlebars',
      '.pug', '.jade', '.ejs', '.erb',
      '.twig', '.liquid', '.jinja', '.jinja2',
    ],
    configExtensions: [
      '.html', '.htm',
      '.json',
      '.yaml', '.yml',
      '.toml',
      '.ini', '.conf', '.config',
      '.env',
      '.properties',
      '.plist',

      // Documentation and markdown
      '.md', '.markdown', '.mdx',
      '.txt', '.rst', '.adoc', '.asciidoc',

      // Build and project files
      '.gradle', '.maven', '.gemfile', '.podfile',
      '.dockerfile', '.containerfile',
    ],
    excludePatterns: [
      'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      'composer.lock', 'pipfile.lock', 'poetry.lock', 'requirements.txt',

      '/dist/', '/build/', '/out/', '/target/', '/bin/', '/obj/',
      '.min.js', '.min.css', '.bundle.js', '.bundle.css', '.map',

      'node_modules/', 'vendor/',

      '.gitignore', '.gitattributes', '.editorconfig',
      '.eslintrc', '.prettierrc',
      'tsconfig.json', 'jsconfig.json',
      'webpack.config', 'vite.config', 'rollup.config',
      'babel.config', '.babelrc',
      'jest.config', 'vitest.config',
      'karma.conf', 'cypress.config', 'playwright.config',

      '/docs/', 'changelog', 'license', 'readme',

      '.vscode/', '.idea/', '.vs/',
      '*.sln', '*.csproj', '*.vcxproj', '*.proj',

      '.generated.', '.g.cs', '.g.ts', '.designer.cs', 'assemblyinfo.cs',

      '.test.', '.spec.', '__tests__/', '/tests/', '/test/',
    ],
    maxHotspots: 20,
  };
}
