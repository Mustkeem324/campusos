const fs = require('fs');

const files = [
  '/home/nx-pro/campusos/apps/web/src/app/(auth)/reset-password/page.tsx',
  '/home/nx-pro/campusos/apps/web/src/app/(auth)/verify-email/page.tsx',
  '/home/nx-pro/campusos/apps/web/src/app/(auth)/activate-account/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('export default function')) {
    const pageNameMatch = content.match(/export default function (\w+)/);
    if (!pageNameMatch) return;
    const pageName = pageNameMatch[1];
    const contentName = pageName + 'Content';
    
    // Rename export default function X to function XContent
    content = content.replace(`export default function ${pageName}`, `function ${contentName}`);
    
    // Add Suspense wrapping export default
    content += `\n\nexport default function ${pageName}() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <${contentName} />
    </React.Suspense>
  );
}\n`;
    
    fs.writeFileSync(file, content);
  }
});
