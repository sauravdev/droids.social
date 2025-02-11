import type React from "react"
import { useEffect, useRef, useCallback } from "react"

interface ComponentProps {
  data: string
  onChange?: (data: string) => void
}

const Editor: React.FC<ComponentProps> = ({ data, onChange }) => {
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const editorInstanceRef = useRef<any>(null)

  const initializeEditor = useCallback(() => {
    const originalWarn = console.warn;
  console.warn = function (message, ...optionalParams) {
    if (typeof message === "string" && message.includes("This editor version is not secure")) {
      return; // Ignore this specific warning
    }
    originalWarn.apply(console, [message, ...optionalParams]);
  };
    if (!editorRef.current) {
      console.error("Editor ref is null")
      return
    }

    if (!window.CKEDITOR) {
      console.error("CKEDITOR is not defined")
      return
    }

    console.log("Initializing CKEditor...")
    const instance = window.CKEDITOR.replace(editorRef.current, {
      height: "170px",
      width: "100%",
      toolbar: [["Bold", "Italic", "Underline"], ["NumberedList", "BulletedList"], ["Link", "Unlink"], ["Source"]],
      contentsCss: [
        "body { background-color: #374151; color: white; font-size: 16px; line-height: 1.6; padding: 20px; border-radius: 10px; border: 2px solid #4b5563; }",
        "h1, h2, h3, h4, h5, h6 { color: #fff; }",
        ".cke_toolbox { background-color: #2d3748; border: none; padding: 8px; width: 100%; max-width: 500px; margin: 0 auto; }",
        ".cke_button { background-color: #4b5563; color: #fff; border-radius: 5px; margin: 2px; padding: 5px 10px; }",
        ".cke_button:hover { background-color: #2d3748; }",
        ".cke_panel { background-color: #2d3748; border: none; }",
        ".cke_editor { border-radius: 10px; border: 1px solid #4b5563; }",
        ".cke_editable { background-color: #374151; color: white; }",
        ".cke_focus { border: 2px solid #4b9f7f; }",
      ],
    })

    if (instance) {
      console.log("CKEditor instance created successfully")
      editorInstanceRef.current = instance

      instance.on("instanceReady", () => {
        console.log("CKEditor instance is ready, setting initial data")
        instance.setData(data)
      })

      instance.on("change", () => {
        const newData = instance.getData()
        console.log("CKEditor content changed")
        onChange?.(newData)
      })
    } else {
      console.error("Failed to create CKEditor instance")
    }
  }, [data, onChange])

  useEffect(() => {
    const loadCKEditor = () => {
      if (typeof window.CKEDITOR === "undefined") {
        console.log("CKEditor not found, loading script...")
        const script = document.createElement("script")
        script.src = "https://cdn.ckeditor.com/4.19.0/standard/ckeditor.js"
        script.async = true
        script.onload = () => {
          console.log("CKEditor script loaded successfully")
          initializeEditor()
        }
        script.onerror = () => console.error("Failed to load CKEditor script.")
        document.body.appendChild(script)
      } else {
        console.log("CKEditor already loaded, initializing...")
        initializeEditor()
      }
    }

    loadCKEditor()

    return () => {
      if (editorInstanceRef.current) {
        console.log("Destroying CKEditor instance")
        editorInstanceRef.current.destroy()
        editorInstanceRef.current = null
      }
    }
  }, [initializeEditor])

  useEffect(() => {
    if (editorInstanceRef.current) {
      console.log("Updating CKEditor data")
      editorInstanceRef.current.setData(data)
    } else {
      console.log("CKEditor instance not ready, data update skipped")
    }
  }, [data])

  return (
    <div className="rounded-lg w-full">
      <div className="mb-4 bg-gray-700 w-full rounded-lg">
        <textarea className="bg-gray-700 w-full rounded-lg" ref={editorRef} />
      </div>
    </div>
  )
}

export default Editor



