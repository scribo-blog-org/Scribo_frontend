import React, { memo, useEffect, useRef, useState } from "react";
import EditorJS from "@editorjs/editorjs";
import { EDITOR_JS_TOOLS } from "./tools";

const Content = ({data}) => {
    let [html, setHtml] = useState('');
    
    useEffect(() => {
        let html = '';
        data.blocks.forEach(block => {
            switch (block.type) {
                case 'header':
                  html += `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
                  break;
                case 'paragraph':
                  html += `<p>${block.data.text}</p>`;
                  break;
                case 'delimiter':
                  html += '<hr />';
                  break;
                case 'image':
                  html += `<img class="img-fluid" src="${block.data.file.url}" title="${block.data.caption}" /><br /><em>${block.data.caption}</em>`;
                  break;
                case 'list':
                  html += '<ul>';
                  block.data.items.forEach(function(li) {
                    html += `<li>${li}</li>`;
                  });
                  html += '</ul>';
                  break;
                default:
                  console.log('Unknown block type', block.type);
                  console.log(block);
                  break;
              }
            // switch
        })

        setHtml(html)
    }, [data])
    
    return <div dangerouslySetInnerHTML={{ __html: html }}></div>;
  }

const Editor = ({ data, onChange, editorblock }) => {
  const ref = useRef();
  //Initialize editorjs
  useEffect(() => {
    //Initialize editorjs if we don't have a reference
    if (!ref.current) {
      const editor = new EditorJS({
        holder: editorblock,

        tools: EDITOR_JS_TOOLS,
        data: data,
        async onChange(api, event) {
          const data = await api.saver.save();
          onChange(data);
        },
      });
      ref.current = editor;
    }

    //Add a return function to handle cleanup
    return () => {
      if (ref.current && ref.current.destroy) {
        ref.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div id={editorblock} />;
};

export default memo(Editor);

export { Content }