import { Card, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

function OneTab(props) {
  return (
    <div>
      <Tabs>
        <TabsList className="flex-row justify-center space-x-4">
          <TabsTrigger value={props.timeline}>{props.timeline}</TabsTrigger>
        </TabsList>
        <TabsContent value={props.timeline}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {props.cardNames.map((eachCard: string, index: number) => {
              const Icon = props.icons[index]
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{eachCard}</CardTitle>
                    <CardDescription>
                      {Math.floor(Math.random() * 10000)}
                    </CardDescription>
                    <Icon className="h-6 w-6 text-blue-500" />
                  </CardHeader>
                </Card>
              )
            })}
          </div>
          {props.cardNames.map((eachCard, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{eachCard[index]}</CardTitle>
                <CardDescription>{props.cardNameValue}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default OneTab
