exports.getAvailableSDKs = () => {
    return [
        {
            id: "node",
            name: "Node.js SDK",
            version: "2.4.0",
            language: "JavaScript/TypeScript",
            installCommand: "npm install @g-axis/sdk-node",
            repoUrl: "https://github.com/g-axis/sdk-node",
            icon: "SiNodedotjs"
        },
        {
            id: "react",
            name: "React SDK",
            version: "1.2.1",
            language: "JavaScript/React",
            installCommand: "npm install @g-axis/sdk-react",
            repoUrl: "https://github.com/g-axis/sdk-react",
            icon: "SiReact"
        },
        {
            id: "python",
            name: "Python SDK",
            version: "3.0.1",
            language: "Python",
            installCommand: "pip install g-axis-sdk",
            repoUrl: "https://github.com/g-axis/sdk-python",
            icon: "SiPython"
        },
        {
            id: "java",
            name: "Java SDK",
            version: "1.8.0",
            language: "Java",
            installCommand: "<dependency><groupId>com.gaxis</groupId><artifactId>sdk</artifactId></dependency>",
            repoUrl: "https://github.com/g-axis/sdk-java",
            icon: "SiJava"
        }
    ];
};
