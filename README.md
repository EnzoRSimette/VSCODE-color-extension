# My first VSCODE extension!

### Hi guys, so, this is basically a extension that allows you to color your comments like better comments but with few more options.
#### I made this using AI (Gemini), i am not that good at programming yet, im still learning so please dont judge so much, this isnt a serious project, just a thing for fancy comments.

## The default configuration:
### No spaces allowed between the symbol and the tag!

| Tag   | Color Name            | Preview Color | Default Style |
|-------|-----------------------|---------------|---------------|
| wb    | Dynamic (white/black) | Theme Based   | Normal        |
| g     | Green                 | #98C379       | Normal        |
| o     | Orange                | #FF8C00       | Normal        |
| r     | Red                   | #FF2D00       | Normal        |
| !     | Alert Red             | #FF2D00       | **Bold**      |
| b     | Blue                  | #3498DB       | Normal        |
| ?     | Query Blue            | #3498DB       | **Bold**      |
| p     | Purple                | #966FD6       | Normal        |
| y     | Yellow                | #E5C07B       | Normal        |
| *     | Sucess                | #98C379       | Normal        |
| todo  | Todo                  | #FF8C00       | **Bold**      |
| w     | White                 | #FFFFFF       | Normal        |
| black | Black                 | #000000       | Normal        |

#### Modifiers & Customization:
- Add an i at the end of any tag to make the comment italic. Exemple -> //gi: This is green and italic.
- Custom HEX/RGB ColorsUse parentheses to define any specific color. Exemple -> //(#FF0080) Pink comment, //(rgb(255,100,0)) Custom RGB, //(#00ffff)i Cyan and italic.
- Comment Types SupportedWorks across almost all programming languages: Single line: //g, #g, ///gMulti-line: /*g ... * and HTML/XML comments.
- You can customize these tags or add new ones in your settings.json:"colorComments.tags":
```
[
  {
    "tag": "my-tag",
    "color": "#ff00ff",
    "bold": true,
    "italic": false,
    "strikethrough": true
  }
]
```
_MIT LICENSED 2026_