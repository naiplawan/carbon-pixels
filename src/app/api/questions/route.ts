import { NextResponse } from 'next/server'
import thailandQuestionsData from '@/data/thailand-questions.json'

export async function GET() {
  return NextResponse.json(thailandQuestionsData, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  })
}